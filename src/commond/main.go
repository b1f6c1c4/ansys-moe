package commond

import (
	"os"
	"path/filepath"
	"time"
)

var dataPath string
var ansysPath string
var globalConfig globalConfigT
var staticLogger func(string)
var logger func(string)
var rLogger remoteLogger
var cancelChans map[string]chan struct{}

// Entry setup commond
// logger: write string to console or file.
func Entry(theLogger func(string)) {
	logger = theLogger
	cancelChans = make(map[string]chan struct{})

	exeDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		panic(err)
	}
	dataPath = filepath.Join(exeDir, "data")
	_ = os.MkdirAll(dataPath, os.ModePerm)
	globalConfig = loadConfig(exeDir)
	logger("Remote url: " + globalConfig.RemoteUrl)

	ansysPath = findAnsysExecutable()
	logger("Ansys path: " + ansysPath)
}

// Loop listen on events
func Loop(stop <-chan struct{}) {
	for {
		// listenWebsocket(stop)
		logger("listenWebsocket quitted")
		select {
		case <-stop:
			return
		case <-time.After(10 * time.Second):
		}
	}
}
