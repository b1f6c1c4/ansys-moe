package mma

import (
	"commond/common"
	"os"
	"os/exec"
	"strings"
	"time"
)

var possiblePaths = []string{
	"C:\\Program Files\\Wolfram Research\\Mathematica\\11.2\\wolframscript.exe",
	"C:\\Program Files\\Wolfram Research\\Mathematica\\11.1\\wolframscript.exe",
	"C:\\Program Files\\Wolfram Research\\Mathematica\\11.0\\wolframscript.exe",
}

func findMmaExecutable() string {
	for i := 0; i < len(possiblePaths); i++ {
		if _, err := os.Stat(possiblePaths[i]); err != nil {
			continue
		}
		return possiblePaths[i]
	}
	panic("Mma executable not found")
}

func (m Module) execMma(e common.ExeContext, args []string, cancel <-chan struct{}) ([]byte, error) {
	ctx := exec.Command(m.mmaPath, args...)
	jArgs := strings.Join(args, " ")

	done := make(chan struct{})
	killing := make(chan error, 1)
	go func() {
		for {
			if ctx.ProcessState == nil || ctx.ProcessState.Exited() {
				return
			}
			common.SR.ReportP(e, ctx.ProcessState.SysUsage)
			select {
			case <-cancel:
				return
			case <-time.After(60 * time.Second):
			}
		}
	}()
	go func() {
		select {
		case <-cancel:
			common.RL.Info(e, "mma/execMma", "Killing process")
			err := ctx.Process.Kill()
			killing <- err
			if err != nil {
				common.RL.Error(e, "mma/execMma", "Killing process: "+err.Error())
				return
			}
			common.RL.Info(e, "mma/execMma", "Process killed")
		case <-done:
		}
	}()

	common.RL.Info(e, "mma/execMma", "Will execute: "+jArgs)
	r, err := ctx.CombinedOutput()
	close(done)
	select {
	case err := <-killing:
		return nil, err
	default:
	}

	common.RL.Info(e, "mma/execMma", "Process exited")
	if err != nil {
		common.RL.Error(e, "mma/execMma", "Process exited: "+err.Error())
		return nil, err
	}
	return r, nil
}
