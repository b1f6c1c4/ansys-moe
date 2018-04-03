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
	common.RL.Info(e, "mma/execMma", "Will execute: "+jArgs)
	err := ctx.Start()
	if err != nil {
		common.RL.Error(e, "mma/execMma", "execution of "+jArgs+": "+err.Error())
		return nil, err
	}

	done := make(chan error, 1)
	go func() {
		done <- ctx.Wait()
	}()
	go func() {
		m, _ := time.ParseDuration("60s")
		for {
			if ctx.ProcessState.Exited() {
				return
			}
			common.SR.ReportP(e, ctx.ProcessState.SysUsage)
			select {
			case <-cancel:
				return
			case <-time.After(m):
			}
		}
	}()
	select {
	case <-cancel:
		common.RL.Info(e, "mma/execMma", "Killing process")
		err := ctx.Process.Kill()
		if err != nil {
			common.RL.Error(e, "mma/execMma", "Killing process: "+err.Error())
			return nil, err
		}
		common.RL.Info(e, "mma/execMma", "Process killed")
	case err := <-done:
		common.RL.Info(e, "mma/execMma", "Process exited")
		if err != nil {
			common.RL.Error(e, "mma/execMma", "Process exited: "+err.Error())
			return nil, err
		}
	}
	r, err := ctx.CombinedOutput()
	if err != nil {
		common.RL.Error(e, "mma/execMma", "Get output: "+err.Error())
		return nil, err
	}
	return r, nil
}
