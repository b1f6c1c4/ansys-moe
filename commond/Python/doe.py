# ansys-moe: Computer-automated Design System
# Copyright (C) 2018  Jinzheng Tu
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
import numpy as np
import lhsmdu

def run(rngs, initEvals):
    d = len(rngs)
    nprngs = np.array(rngs)
    arr = np.asarray(np.transpose(lhsmdu.sample(d, initEvals)))
    scarr = np.rint(arr * (nprngs - 1))
    return np.unique(scarr, axis=0)
