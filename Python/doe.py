import numpy as np
import lhsmdu

def run(rngs, initEvals):
    d = len(rngs)
    nprngs = np.array(rngs)
    arr = np.asarray(np.transpose(lhsmdu.sample(d, initEvals)))
    scarr = np.rint(arr * (nprngs - 1))
    return np.unique(scarr, axis=0)
