package ansysd

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/websocket"
)

var dataPath string
var ansysPath string
var globalConfig globalConfigT
var logger func(string)
var cancelChans map[string]chan struct{}

// Entry setup ansysd
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


	// TODO
	return


	ansysPath = findAnsysExecutable()
	logger("Ansys path: " + ansysPath)
}

// Loop listen on events
func Loop(stop <-chan struct{}) {
	reports := make(chan *Report)
	watchLog("fuck.log", nil, reports, nil)
	return
	for {
		listenWebsocket(stop)
		logger("listenWebsocket quitted")
		select {
		case <-stop:
			return
		case <-time.After(10 * time.Second):
		}
	}
}

func listenWebsocket(stop <-chan struct{}) {
	c, _, err := websocket.DefaultDialer.Dial(globalConfig.WebsocketUrl, nil)
	if err != nil {
		logger("Creating websocket: " + err.Error())
		return
	}
	logger("listenWebsocket succeed")

	reports := make(chan *Report)
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			if _, message, err := c.ReadMessage(); err != nil {
				logger("Reading websocket: " + err.Error())
			} else {
				dispatchMessage(message, reports)
			}
		}
	}()

	for {
		select {
		case <-done:
			return
		case report := <-reports:
			js, err := json.Marshal(report)
			if err != nil {
				logger("Marshaling report: " + err.Error())
				break
			}
			err = c.WriteMessage(websocket.TextMessage, js)
			if err != nil {
				logger("Writing websocket: " + err.Error())
				return
			}
			break
		case <-stop:
			err = c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if err != nil {
				logger("Closing websocket: " + err.Error())
				return
			}
			select {
			case <-done:
			case <-time.After(time.Second):
			}
			return
		}
	}
}
