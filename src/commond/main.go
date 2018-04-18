package commond

import (
	"commond/ansys"
	"commond/common"
	"commond/mma"
	"commond/rlang"
	"time"
)

func delayed(ch <-chan struct{}, m time.Duration) chan struct{} {
	c := make(chan struct{})
	go func() {
		select {
		case <-ch:
		}
		select {
		case <-time.After(m):
		}
		close(c)
	}()
	return c
}

// Entry setup commond
func Entry(theLogger func(string)) {
	common.Entry(theLogger)
}

func addModule(m common.Module, stop <-chan struct{}) {
	common.SL("Adding module " + m.GetKind())
	ch := make(chan *common.RawCommand)
	err := subscribeCommand(m.GetKind(), ch)
	if err != nil {
		panic(err)
	}
	common.RL.Info(m, "main", "Added module")
	go func() {
		for {
			select {
			case raw := <-ch:
				common.SL("Received command of kind " + m.GetKind())
				go m.Run(raw)
			case <-stop:
				return
			}
		}
	}()
}

// Loop listen on events
func Loop(stop <-chan struct{}) {
	err := setupAmqp(delayed(stop, time.Second))
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
	if common.C.EnableMma {
		addModule(mma.NewModule(act, subscribeCancel, unsubscribeCancel), stop)
	}
	if common.C.EnableRLang {
		addModule(rlang.NewModule(act, subscribeCancel, unsubscribeCancel), stop)
	}

	common.SL("Started event loop")
	common.RL.Info(common.Core, "main", "Started event loop")

rpt:
	for {
		common.SR.Report(common.Core)
		select {
		case <-stop:
			common.SL("Received signal to stop")
			common.RL.Fatal(common.Core, "main", "Received signal to stop")
			break rpt
		case <-time.After(60 * time.Second):
		}
	}
	select {
	case <-time.After(2 * time.Second):
	}
}
