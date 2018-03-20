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

// Loop listen on events
func Loop(stop <-chan bool) {
	reports := make(chan *Report)
	finished := make(chan bool)
	go executeAnsys(&Job{
		Name:     "xxx",
		FileName: "Project1.aedt",
	}, reports, finished)
	for {
		select {
		case report := <-reports:
			logger("Got report: " + report.Name)
			if report.Finished {
				logger("Finished!")
			}
			if report.Success {
				logger("Success!")
			}
			logger(report.Log.ValueOrZero())
		case <-stop:
			break
		}
	}
}
