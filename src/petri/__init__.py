import logging

class EtcdWrapper:
    def __init__(self, etcd, base, root):
        self.__etcd = etcd
        self.__base = base
        self.__root = root
        self.__map = {}

    @property
    def base(self):
        return self.__base

    @property
    def root(self):
        return self.__root

    def get(self, key):
        if key not in self.__map:
            prev = self.__etcd.get(self.__base + key)
            self.__map[key] = int(prev[0] or '0')
        return self.__map[key]

    def incr(self, key, val):
        self.get(key)
        self.__map[key] += val

    def decr(self, key, val):
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
        self.__registry = []
        self.__tags = {}

    def static(self, listen=None, tag=None):
        """Declare an static-input static-output transition
        f MUST return [changed_keys]
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
        f MUST return ([static_changed_keys], [dynamic_changed_keys])
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

    def _execute(self, reg, changed, e):
        kind, func = reg
        try:
            logging.debug('Will execute %s %s', kind, func.__name__)
            chg = func(changed, e)
            logging.info('%s changed %s', func.__name__, chg)
            return chg
        except Exception as ex:
            logging.error('Error during executing %s: %s', func.__name__, ex)

    def _execute_external(self, tag, e, payload):
        if tag not in self.__tags:
            logging.warning('Tag %s not found', tag)
            return None
        reg = self.__tags[tag]
        kind, func = reg
        try:
            logging.debug('Will execute %s %s due to %s', kind, func.__name__, tag)
            chg = func(None, e, payload)
            logging.info('%s changed %s', func.__name__, chg)
            return chg
        except Exception as ex:
            logging.error('Error during executing %s due to %s: %s', func.__name__, tag, ex)
