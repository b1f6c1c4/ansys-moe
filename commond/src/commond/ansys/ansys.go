package ansys

import (
	"commond/common"
	"errors"
	"os"
	"os/exec"
	"strings"
)

func findAnsysExecutable() string {
	if _, err := os.Stat(common.C.PathAnsys); err == nil {
		return common.C.PathAnsys
	}
	panic("Ansys executable not found")
}

func (m Module) execAnsys(e common.ExeContext, args []string, cancel <-chan struct{}) error {
	ctx := exec.Command(m.ansysPath, args...)
	common.PrepareKiller(ctx)
	jArgs := strings.Join(args, " ")
	common.RL.Info(e, "ansys/execAnsys", "Will execute: "+jArgs)
	err := ctx.Start()
	if err != nil {
		common.RL.Error(e, "ansys/execAnsys", "execution of "+jArgs+": "+err.Error())
		return err
	}

	done := make(chan error)
	go func() {
		err := ctx.Wait()
		if err != nil {
			common.RL.Error(e, "ansys/execAnsys", "Process exited: "+err.Error())
		} else {
			common.RL.Info(e, "ansys/execAnsys", "Process exited")
		}
		done <- err
	}()
	select {
	case <-cancel:
		if ctx.Process == nil {
			common.RL.Warn(e, "ansys/execAnsys", "Killing: already exited")
			return errors.New("Cancelled")
		}
		err := common.RunKiller(ctx)
		if err != nil {
			common.RL.Error(e, "ansys/execAnsys", "Killing process: "+err.Error())
			return err
		}
		common.RL.Info(e, "ansys/execAnsys", "Process killed")
		return errors.New("Cancelled")
	case err := <-done:
		return err
	}
}
