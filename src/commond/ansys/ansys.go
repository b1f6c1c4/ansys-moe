package ansys

import (
	"commond/common"
	"os"
	"os/exec"
	"strings"
	"time"
)

var possiblePaths = []string{
	"C:\\Program Files\\AnsysEM\\AnsysEM15.0\\Win64\\maxwell.exe",
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
		common.RL.Info(e, "ansys/execAnsys", "Killing process")
		err := ctx.Process.Kill()
		if err != nil {
			common.RL.Error(e, "ansys/execAnsys", "Killing process: "+err.Error())
			return err
		}
		common.RL.Info(e, "ansys/execAnsys", "Process killed")
	case err := <-done:
		common.RL.Info(e, "ansys/execAnsys", "Process exited")
		if err != nil {
			common.RL.Error(e, "ansys/execAnsys", "Process exited: "+err.Error())
			return err
		}
	}
	return nil
}
