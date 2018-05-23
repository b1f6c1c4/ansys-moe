package common

import (
	"os"
	"path/filepath"
)

// Core is kind=core
var Core ExeContext

// DataPath is ./data
var DataPath string

// SL writes to console or Windows events
var SL func(string, string)

// RL writes to remote logger
var RL RemoteLoggerT

// C stores ./config.yaml
var C GlobalConfigT

// M stores meta info
var M MetaInfo

// Entry setup commond
func Entry(theLogger func(string, string), log chan<- *LogReport) {
	Core = &RawCommand{"", "core", "", nil, nil}
	SL = theLogger
	RL = RemoteLoggerT{log}

	M.Component = "ansys-commond"
	M.Hostname, _ = os.Hostname()
	M.Pid = os.Getpid()

	exeDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		panic(err)
	}
	DataPath = filepath.Join(exeDir, "data")
	_ = os.MkdirAll(DataPath, os.ModePerm)
	C = loadConfig(exeDir)
}
