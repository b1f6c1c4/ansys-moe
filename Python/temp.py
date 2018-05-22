import numpy
import lhsmdu
import sys
from json_tricks import dumps

sys.stdout.write(dumps(numpy.transpose(lhsmdu.sample(2, 8)), primitives=True))
