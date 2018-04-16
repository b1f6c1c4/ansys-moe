import re
import logging

class PetriRuntime:
    def __init__(self, etcd, base, root):
        self.__etcd = etcd
        self.__base = base
        self.__root = root
        self.__map = {}
        self.__incrd = set()
        self.__lock = self.__etcd.lock(self.__base)

    def __enter__(self):
        self.__lock.acquire()

    def __exit__(self, exc_type, exc_value, traceback):
        self.__lock.release()

    @property
    def base(self):
        return self.__base

    @property
    def root(self):
        return self.__root

    def clear_incrd(self):
        t = self.__incrd
        self.__incrd = set()
        return t

    def get(self, key):
        if key not in self.__map:
            prev = self.__etcd.get(self.__base + key)
            self.__map[key] = int(prev[0] or '0')
        return self.__map[key]

    def incr(self, key, val):
        if val <= 0:
            raise ValueError('val must be positive')
        self.get(key)
        self.__map[key] += val
        self.__incrd.add(key)

    def decr(self, key, val):
        if val <= 0:
            raise ValueError('val must be positive')
        self.get(key)
        if self.__map[key] < val:
            return False
        self.__map[key] -= val
        return True

    def finalize(self):
        succ = [self.__etcd.transactions.put(self.__base + k, str(v))
                for k, v in self.__map.items()]
        self.__etcd.transaction(compare=[], success=succ, failure=[])

class PetriNet:
    def __init__(self, etcd, root_regex):
        self.__etcd = etcd
        self.__root_regex = root_regex
        self.__root_regex_compiled = re.compile('^'+self.__root_regex+'$')
        self.__registry = []
        self.__tags = {}

    def static(self, listen=None, tag=None):
        """Declare an static-input static-output transition
        If tag == None:
            Call f(changed, e) when a key listened changed
        If tag != None:
            Call f(None, e, payload) when (base, tag, payload) dispatched
        """
        def decorator(func):
            reg = ('static', func, listen, tag)
            if tag != None:
                if tag in self.__tags:
                    raise ValueError('Duplicated tag: '+tag)
                self.__tags[tag] = reg
            self.__registry.append(reg)
        return decorator

    def dynamic_fork(self, key_num, listen=None, tag=None):
        """Declare an static-input dynamic-output transition
        f MUST return number of dynamic output
        f MUST NOT manually modify key_num
        If tag == None:
            Call f(changed, e) when a key listened changed
        If tag != None:
            Call f(None, e, payload) when (base, tag, payload) dispatched
        """
        def decorator(func):
            reg = ('fork', func, listen, tag, key_num)
            if tag != None:
                if tag in self.__tags:
                    raise ValueError('Duplicated tag: '+tag)
                self.__tags[tag] = reg
            self.__registry.append(reg)
        return decorator

    def dispatch(self, action):
        base, tag, payload = action
        m = self.__root_regex_compiled.search(base)
        root = m.group('root')
        e = PetriRuntime(self.__etcd, base, root)
        with e:
            changed = self._execute_external(tag, e, payload)
            self._execute_all(e)
            e.finalize()

    def _execute_all(self, e):
        chg = e.clear_incrd()
        while chg:
            print(chg)
            todo = {reg
                    for c in chg
                    for reg in self.__registry
                    if PetriNet._listens(reg, c)}
            for reg in todo:
                PetriNet._execute(reg, chg, e)
            chg = e.clear_incrd()

    @staticmethod
    def _listens(reg, c):
        print(reg, c)
        listen = reg[2]
        if not listen:
            return False
        return any(re.match('^'+l+'$', c) for l in listen)

    @staticmethod
    def _execute(reg, changed, e):
        kind, func, *_ = reg
        try:
            logging.debug('Will execute %s %s', kind, func.__name__)
            num = func(changed, e)
            PetriNet._finalize_execution(reg, e, num)
        except Exception as ex:
            logging.error('Error during executing %s: %s', func.__name__, ex)

    def _execute_external(self, tag, e, payload):
        if tag not in self.__tags:
            logging.warning('Tag %s not found', tag)
            return
        reg = self.__tags[tag]
        kind, func, *_ = reg
        try:
            logging.debug('Will execute %s %s due to %s', kind, func.__name__, tag)
            num = func(None, e, payload)
            PetriNet._finalize_execution(reg, e, num)
        except Exception as ex:
            logging.error('Error during executing %s due to %s: %s', func.__name__, tag, ex)

    @staticmethod
    def _finalize_execution(reg, e, num):
        kind, func, *_ = reg
        if kind == 'static':
            pass
        elif kind == 'dynamic':
            key_num = reg[3]
            if e.get(key_num) != 0:
                raise ValueError('Reentrance: '+func.__name__)
            e.incr(key_num, 1 + num)
        else:
            raise ValueError('Kind not supported: '+kind)
