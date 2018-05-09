package mma

import (
	"commond/common"
	"errors"
	"os"
	"os/exec"
	"strings"
)

func findMmaExecutable() string {
	if _, err := os.Stat(common.C.PathMma); err == nil {
		return common.C.PathMma
	}
	panic("Mma executable not found")
}

func (m Module) execMma(e common.ExeContext, args []string, cancel <-chan struct{}) ([]byte, error) {
	ctx := exec.Command(m.mmaPath, args...)
	common.PrepareKiller(ctx)
	jArgs := strings.Join(args, " ")

	stderr, err := ctx.StderrPipe()
	if err != nil {
		common.RL.Error(e, "mma/execMma", "Cannot get StderrPipe: "+err.Error())
	} else {
		go common.PipeLog(e, stderr)
	}

	done := make(chan struct{})
	killing := make(chan error, 1)
	go func() {
		select {
		case <-cancel:
			if ctx.Process == nil {
				common.RL.Warn(e, "mma/execMma", "Killing: already exited")
				killing <- errors.New("Cancelled")
				return
			}
			common.RL.Info(e, "mma/execMma", "Killing process")
			err := common.RunKiller(ctx)
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
