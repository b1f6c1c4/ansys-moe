package ansys

import (
	"commond/common"
)

var ansysPath string

// Entry setup ansys
func Entry() {
	ansysPath = findAnsysExecutable()
	common.SL("Ansys path: " + ansysPath)
}

// Run parse and execute a command
func Run(raw *RawCommand, rpt chan<- ExeContext, cctrl chan<- CancelControl, cancel <-chan struct{}) {
	defer func() {
		if r := recover(); r != nil {
			common.RL.Error(cmd, "ansys", "Recovered panic: " + r)
		}
	}()

	var cmd Command
	err := json.Unmarshal(raw.Data, &cmd)
	if err != nil {
		common.RL.Error(cmd, "ansys", "Unmarshaling json: " + err.Error())
		return
	}

	var exe executor
	switch cmd.Type {
	case "mutate":
		exe = runMutate{&cmd}
	case "solve":
		exe = runSolve{&cmd}
	case "extract":
		exe = runExtract{&cmd}
	default:
		common.RL.Error(cmd, "ansys", "Unsupported type: " + cmd.Type)
		return
	}

	cctrl <- &CancelControl{cmd.CommandID, true}
	defer func() {
		cctrl <- &CancelControl{cmd.CommandID, true}
	}()

	err = exe.Run(rpt, cancel)
}
