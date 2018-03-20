package ansysd

import (
	"os"
	"path/filepath"
)

var dataPath string
var ansysPath string
var logger func(string)

// Entry setup ansysd
// logger: write string to console or file.
func Entry(theLogger func(string)) {
	logger = theLogger

	if exeDir, err := filepath.Abs(filepath.Dir(os.Args[0])); err != nil {
		panic(err)
	} else {
		dataPath = filepath.Join(exeDir, "data")
	}
	_ = os.MkdirAll(filepath.Join(dataPath, "raw"), os.ModePerm)
	_ = os.MkdirAll(filepath.Join(dataPath, "temp"), os.ModePerm)

	ansysPath = findAnsysExecutable()
	logger("Ansys path: " + ansysPath)
}
