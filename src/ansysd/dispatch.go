package ansysd

import (
	"encoding/json"
)

func dispatchMessage(message []byte, rpt chan<- *Report) {
	defer func() {
		if r := recover(); r != nil {
			logger("Recovered in dispatchMessage")
		}
	}()

	var cmd Command
	err := json.Unmarshal(message, &cmd)
	if err != nil {
		logger("Unmarshaling json: " + err.Error())
		return
	}

	var exe executor
	switch cmd.Type {
	case "kill":
		ch := cancelChans[cmd.CommandID]
		if ch != nil {
			close(ch)
		}
		return
	case "download":
		exe = runDownload{&cmd}
	case "createJob":
		exe = runCreateJob{&cmd}
	case "mutate":
		exe = runMutate{&cmd}
	case "solve":
		exe = runSolve{&cmd}
	case "extract":
		exe = runExtract{&cmd}
	case "drop":
		exe = runDrop{&cmd}
	default:
		logger("Unsupported type: " + cmd.Type)
		return
	}

	cancel := make(chan struct{})
	cancelChans[cmd.CommandID] = cancel
	go func() {
		exe.Run(rpt, cancel)
		close(cancel)
		delete(cancelChans, cmd.CommandID)
	}()
}
