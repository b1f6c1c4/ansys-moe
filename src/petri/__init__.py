import re
import logging
from .runtime import PetriRuntime
from .transition import Transition

class PetriNet:
    def __init__(self, etcd, root_regex):
        self.__etcd = etcd
        self.__root_regex = root_regex
        self.__root_regex_compiled = re.compile('^'+self.__root_regex+'$')
        self.__registry = []
        self.__tags = {}

    def __call__(self, func):
        if not isinstance(func, Transition):
            raise ValueError('{0} not registerable'.format(func))
        if func.tag != None:
            if func.tag in self.__tags:
                raise ValueError('Tag {0} duplicated'.format(func.tag))
            self.__tags[func.tag] = func
        self.__registry.append(func)
        logging.info('Registered %s', func)
        return func

    def dispatch(self, action):
        base, tag, payload = action
        m = self.__root_regex_compiled.search(base)
        root = m.group('root')
        if tag not in self.__tags:
            logging.warning('Tag %s not found', tag)
            return
        e = PetriRuntime(self.__etcd, base, root)
        with e:
            self.__tags[tag].execute(None, e, payload)
            self._execute_all(e)
            e.finalize()

    def _execute_all(self, e):
        chg = e.clear_incrd()
        while chg:
            for reg in self.__registry:
                if not reg.tag:
                    reg.execute(chg, e)
            chg = e.clear_incrd()
