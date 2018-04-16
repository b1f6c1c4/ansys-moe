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
