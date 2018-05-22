package python

import (
	"commond/common"
	"errors"
	"os"
	"os/exec"
	"strings"
)

func findPythonExecutable() string {
	if _, err := os.Stat(common.C.PathPython); err == nil {
		return common.C.PathPython
	}
	if _, err := os.Stat("/usr/bin/python"); err == nil {
		return "/usr/bin/python"
	}
	panic("Python executable not found")
}

func (m Module) execPython(e common.ExeContext, args []string, cancel <-chan struct{}) ([]byte, error) {
	ctx := exec.Command(m.pythonPath, args...)
	common.PrepareKiller(ctx)
	jArgs := strings.Join(args, " ")

	stderr, err := ctx.StderrPipe()
	if err != nil {
		common.RL.Error(e, "python/execPython", "Cannot get StderrPipe: "+err.Error())
	} else {
		go common.PipeLog(e, stderr)
	}

	done := make(chan struct{})
	killing := make(chan error, 1)
	go func() {
		select {
		case <-cancel:
			if ctx.Process == nil {
				common.RL.Warn(e, "python/execPython", "Killing: already exited")
				killing <- errors.New("Cancelled")
				return
			}
			common.RL.Info(e, "python/execPython", "Killing process")
			err := common.RunKiller(ctx)
			if err != nil {
				common.RL.Error(e, "python/execPython", "Killing process: "+err.Error())
				killing <- err
				return
			}
			common.RL.Info(e, "python/execPython", "Process killed")
			killing <- errors.New("Cancelled")
		case <-done:
		}
	}()

	common.RL.Info(e, "python/execPython", "Will execute: "+jArgs)
	r, err := ctx.Output()
	close(done)
	select {
	case err := <-killing:
		return nil, err
	default:
	}

	common.RL.Info(e, "python/execPython", "Process exited")
	if err != nil {
		common.RL.Error(e, "python/execPython", "Process exited: "+err.Error())
		return nil, err
	}
	return r, nil
}
