package mma

import (
	"commond/common"
	"errors"
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

	stderr, err := ctx.StderrPipe()
	if err != nil {
		common.RL.Error(e, "mma/execMma", "Cannot get StderrPipe: "+err.Error())
	} else {
		go common.PipeLog(e, stderr);
	}

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
			if ctx.Process == nil {
				common.RL.Warn(e, "mma/execMma", "Killing: already exited")
				killing <- errors.New("Cancelled")
				return
			}
			common.RL.Info(e, "mma/execMma", "Killing process")
			err := ctx.Process.Kill()
			if err != nil {
				common.RL.Error(e, "mma/execMma", "Killing process: "+err.Error())
				killing <- err
				return
			}
			common.RL.Info(e, "mma/execMma", "Process killed")
			killing <- errors.New("Cancelled")
		case <-done:
		}
	}()

	common.RL.Info(e, "mma/execMma", "Will execute: "+jArgs)
	r, err := ctx.Output()
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
