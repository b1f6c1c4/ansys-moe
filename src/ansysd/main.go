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

// Entry setup ansysd
// logger: write string to console or file.
func Entry(theLogger func(string)) {
	logger = theLogger

	if exeDir, err := filepath.Abs(filepath.Dir(os.Args[0])); err != nil {
		panic(err)
	} else {
		dataPath = filepath.Join(exeDir, "data")
		globalConfig = loadConfig(exeDir)
	}
	logger("Remote url: " + globalConfig.RemoteUrl)

	ansysPath = findAnsysExecutable()
	logger("Ansys path: " + ansysPath)
}

// Loop listen on events
func Loop(stop <-chan struct{}) {
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
	var c *websocket.Conn
	if w, _, err := websocket.DefaultDialer.Dial(globalConfig.WebsocketUrl, nil); err != nil {
		logger("Creating websocket: " + err.Error())
		return
	} else {
		c = w
		logger("listenWebsocket succeed")
	}

	reports := make(chan *Report)
	done := make(chan struct{})
	// go func() {
	// 	defer close(done)
	// 	for {
	// 		if _, message, err := c.ReadMessage(); err != nil {
	// 			logger("Reading websocket: " + err.Error())
	// 			return
	// 		} else {
	// 			// var job Job
	// 			// if err := json.Unmarshal([]byte(message), &job); err != nil {
	// 			// 	logger("Unmarshaling json: " + err.Error())
	// 			// } else {
	// 			// 	go executeAnsys(&job, reports, make(chan struct{}))
	// 			// }
	// 		}
	// 	}
	// }()

	for {
		select {
		case <-done:
			return
		case report := <-reports:
			var js []byte
			if j, err := json.Marshal(report); err != nil {
				logger("Marshaling report: " + err.Error())
				break
			} else {
				js = j
			}
			if err := c.WriteMessage(websocket.TextMessage, js); err != nil {
				logger("Writing websocket: " + err.Error())
				return
			}
			break
		case <-stop:
			if err := c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "")); err != nil {
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
