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
