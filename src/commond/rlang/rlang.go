package rlang

import (
	"commond/common"
	"errors"
	"os"
	"os/exec"
	"strings"
)

var possiblePaths = []string{
	"/usr/bin/Rscript",
	"C:\\Program Files\\R\\R-3.4.4\\bin\\Rscript.exe",
}

func findRLangExecutable() string {
	for i := 0; i < len(possiblePaths); i++ {
		if _, err := os.Stat(possiblePaths[i]); err != nil {
			continue
		}
		return possiblePaths[i]
	}
	panic("RLang executable not found")
}

func (m Module) execRLang(e common.ExeContext, args []string, cancel <-chan struct{}) ([]byte, error) {
	ctx := exec.Command(m.rlangPath, args...)
	jArgs := strings.Join(args, " ")

	stderr, err := ctx.StderrPipe()
	if err != nil {
		common.RL.Error(e, "rlang/execRLang", "Cannot get StderrPipe: "+err.Error())
	} else {
		go common.PipeLog(e, stderr);
	}

	done := make(chan struct{})
	killing := make(chan error, 1)
	go func() {
		select {
		case <-cancel:
			if ctx.Process == nil {
				common.RL.Warn(e, "rlang/execRLang", "Killing: already exited")
				killing <- errors.New("Cancelled")
				return
			}
			common.RL.Info(e, "rlang/execRLang", "Killing process")
			err := ctx.Process.Kill()
			if err != nil {
				common.RL.Error(e, "rlang/execRLang", "Killing process: "+err.Error())
				killing <- err
				return
			}
			common.RL.Info(e, "rlang/execRLang", "Process killed")
			killing <- errors.New("Cancelled")
		case <-done:
		}
	}()

	common.RL.Info(e, "rlang/execRLang", "Will execute: "+jArgs)
	r, err := ctx.Output()
	close(done)
	select {
	case err := <-killing:
		return nil, err
	default:
	}

	common.RL.Info(e, "rlang/execRLang", "Process exited")
	if err != nil {
		common.RL.Error(e, "rlang/execRLang", "Process exited: "+err.Error())
		return nil, err
	}
	return r, nil
}
