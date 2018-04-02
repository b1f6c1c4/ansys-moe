package common

import (
	"os"
	"path/filepath"
)

// DataPath is ./data
var DataPath string

// SL writes to console or Windows events
var SL func(string)

// RL writes to amqp
var RL RemoteLoggerT

// SR reports to amqp
var SR StatusReporter

// C stores ./config.yaml
var C GlobalConfigT

// Entry setup commond
func Entry(theLogger func(string)) {
	SL = theLogger

	exeDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		panic(err)
	}
	DataPath = filepath.Join(exeDir, "data")
	_ = os.MkdirAll(DataPath, os.ModePerm)
	C = loadConfig(exeDir)
	SL("Remote url: " + C.RemoteUrl)
}

// SetupRL setup remote logger
func SetupRL(ch chan<- *LogReport) {
	RL = RemoteLoggerT{ch}
}

// SetupSR setup status reporter
func SetupSR(ch chan<- *StatusReport) {
	SR = StatusReporter{ch}
}
