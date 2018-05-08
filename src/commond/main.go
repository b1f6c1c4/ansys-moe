package commond

import (
	"commond/ansys"
	"commond/common"
	"commond/mma"
	"commond/rlang"
	"time"
)

// VERSION is defined during compilation
var VERSION string

// COMMITHASH is defined during compilation
var COMMITHASH string

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
	common.M.Version.Version = VERSION
	common.M.Version.CommitHash = COMMITHASH
	common.Entry(theLogger)
	common.SL("VERSION: " + VERSION)
	common.SL("COMMITHASH: " + COMMITHASH)
}

func addModule(m common.Module, pref int, stop <-chan struct{}) {
	common.SL("Adding module " + m.GetKind())
	ch := make(chan *common.RawCommand)
	err := subscribeCommand(m.GetKind(), pref, ch)
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

	act := make(chan common.ExeContext)
	go publishAction(act)

	common.RL.Info(common.Core, "main", "Start adding modules")

	if common.C.PrefetchAnsys > 0 {
		addModule(ansys.NewModule(act, subscribeCancel, unsubscribeCancel), common.C.PrefetchAnsys, stop)
	}
	if common.C.PrefetchMma > 0 {
		addModule(mma.NewModule(act, subscribeCancel, unsubscribeCancel), common.C.PrefetchMma, stop)
	}
	if common.C.PrefetchRLang > 0 {
		addModule(rlang.NewModule(act, subscribeCancel, unsubscribeCancel), common.C.PrefetchRLang, stop)
	}

	common.SL("Started event loop")
	common.RL.Info(common.Core, "main", "Started event loop")

	select {
	case <-stop:
		common.SL("Received signal to stop")
		common.RL.Fatal(common.Core, "main", "Received signal to stop")
	}
	select {
	case <-time.After(2 * time.Second):
	}
}
