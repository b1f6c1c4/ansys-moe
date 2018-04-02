package commond

import (
	"commond/ansys"
	"commond/common"
)

// Entry setup commond
func Entry(theLogger func(string)) {
	common.Entry(theLogger)
}

func addModule(m common.Module, stop <-chan struct{}) {
	ch := make(chan *common.RawCommand)
	go subscribeCommand(m.GetKind(), ch)
	for {
		select {
		case raw := <-ch:
			go m.Run(raw)
		case <-stop:
			return
		}
	}
}

// Loop listen on events
func Loop(stop <-chan struct{}) {
	setupAmqp(stop)
	act := make(chan common.ExeContext)
	go publishAction(act)
	addModule(ansys.NewModule(act, subscribeCancel, unsubscribeCancel), stop)
}
