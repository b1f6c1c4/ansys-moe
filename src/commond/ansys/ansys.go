package ansys

import (
	"commond/common"
	"errors"
	"os"
	"os/exec"
	"strings"
)

var possiblePaths = []string{
	"D:\\Program Files\\Ansoft\\Maxwell14.0\\maxwell.exe",
	"D:\\Program Files\\AnsysEM\\AnsysEM18.0\\Win64\\ansysedt.exe",
}

func findAnsysExecutable() string {
	for i := 0; i < len(possiblePaths); i++ {
		if _, err := os.Stat(possiblePaths[i]); err != nil {
			continue
		}
		return possiblePaths[i]
	}
	panic("Ansys executable not found")
}

func (m Module) execAnsys(e common.ExeContext, args []string, cancel <-chan struct{}) error {
	ctx := exec.Command(m.ansysPath, args...)
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
		err := ctx.Process.Kill()
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
