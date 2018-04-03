package commond

import (
	"commond/ansys"
	"commond/common"
	"time"
)

// Entry setup commond
func Entry(theLogger func(string)) {
	common.Entry(theLogger)
}

func addModule(m common.Module, stop <-chan struct{}) {
	common.SL("Adding module " + m.GetKind())
	ch := make(chan *common.RawCommand)
	go subscribeCommand(m.GetKind(), ch)
	common.RL.Info(m, "main", "Added module")
	for {
		select {
		case raw := <-ch:
			common.SL("Received command of kind " + m.GetKind())
			go m.Run(raw)
		case <-stop:
			return
		}
	}
}

// Loop listen on events
func Loop(stop <-chan struct{}) {
	err := setupAmqp(stop)
	if err != nil {
		panic(err)
	}
	common.SL("Amqp Connected")

	log := make(chan *common.LogReport)
	go publishLog(log)
	common.SetupRL(log)

	stt := make(chan *common.StatusReport)
	go publishStatus(stt)
	common.SetupSR(stt)

	act := make(chan common.ExeContext)
	go publishAction(act)

	common.RL.Info(common.Core, "main", "Start adding modules")

	if common.C.EnableAnsys {
		addModule(ansys.NewModule(act, subscribeCancel, unsubscribeCancel), stop)
	}

	common.SL("Started event loop")
	common.RL.Info(common.Core, "main", "Started event loop")

	m, _ := time.ParseDuration("60s")
	for {
		common.SR.Report(common.Core)
		select {
		case <-stop:
			return
		case <-time.After(m):
		}
	}
}
