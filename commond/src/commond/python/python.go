/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
	if _, err := os.Stat("/usr/local/bin/python"); err == nil {
		return "/usr/local/bin/python"
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
