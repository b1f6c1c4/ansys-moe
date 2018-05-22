import numpy as np
import lhsmdu

def run(rngs, initEvals):
    d = len(rngs)
    arr = np.transpose(lhsmdu.sample(d, initEvals))
    return np.rint(arr / (rngs - 1))
