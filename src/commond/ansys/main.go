package ansys

import (
	"commond/common"
)

var ansysPath string

// Entry setup commond
func Entry() {
	ansysPath = findAnsysExecutable()
	common.SL("Ansys path: " + ansysPath)
}
