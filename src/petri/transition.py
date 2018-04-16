import logging

class Transition:
    def __init__(self, tag):
        self.__tag = tag

    @property
    def tag(self):
        return self.__tag

    def __call__(self, func):
        # pylint: disable=attribute-defined-outside-init
        self._func = func
        return self

    def __str__(self):
        c = self.__class__.__name__
        f = self._func.__name__
        if self.__tag:
            return '<{0} #{2} {1}>'.format(c, f, self.__tag)
        return '<{0} {1}>'.format(c, f)

    def execute(self, changed, e, payload=None):
        try:
            logging.debug('Will execute %s', self)
            self._execute(changed, e, payload)
        except Exception:
            logging.exception('Error during executing %s', self)

    def _execute(self, changed, e, payload):
        pass

class Static(Transition):
    def __init__(self, tag=None):
        Transition.__init__(self, tag)

    def _execute(self, changed, e, payload):
        if payload is None:
            self._func(changed, e)
        else:
            self._func(changed, e, payload)

class DynamicFork(Transition):
    def __init__(self, key_num, tag=None):
        Transition.__init__(self, tag)
        self.__key_num = key_num

    def _execute(self, changed, e, payload):
        if payload is None:
            num = self._func(changed, e)
        else:
            num = self._func(changed, e, payload)
        if e.get(self.__key_num) != 0:
            raise ValueError('Reentrance of {0}'.format(self))
        e.incr(self.__key_num, 1 + num)
