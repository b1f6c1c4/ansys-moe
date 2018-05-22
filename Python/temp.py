import numpy
import lhsmdu
import sys

sys.stdout.write(dumps(numpy.transpose(lhsmdu.sample(2, 8)), primitives=True))
