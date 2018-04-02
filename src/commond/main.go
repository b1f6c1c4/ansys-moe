package commond

import (
	"time"
)

var cancelChans map[string]chan struct{}

// Entry setup commond
func Entry(theLogger func(string)) {
	cancelChans = make(map[string]chan struct{})

}

// Loop listen on events
func Loop(stop <-chan struct{}) {
	for {
		// listenWebsocket(stop)
		// logger("listenWebsocket quitted")
		select {
		case <-stop:
			return
		case <-time.After(10 * time.Second):
		}
	}
}
