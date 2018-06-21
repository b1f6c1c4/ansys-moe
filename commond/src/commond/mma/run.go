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
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/teris-io/shortid"
)

func (m Module) run(cmd *mmaCommand, cancel <-chan struct{}) (string, error) {
	id := cmd.Raw.CommandID + "." + shortid.MustGenerate()
	common.RL.Info(cmd.Raw, "mma/run", "Command started")

	if !cmd.Script.Valid {
		err := errors.New("script")
		common.RL.Error(cmd.Raw, "mma/run", "Parse input: "+err.Error())
		return "", err
	}
	script := cmd.Script.String

	// Save `script` to `data/{xId}.wls`
	scriptFile := filepath.Join(common.DataPath, id+".wls")
	err := ioutil.WriteFile(scriptFile, []byte(script), os.ModePerm)
	if err != nil {
		common.RL.Error(cmd.Raw, "mma/run", "Save script: "+err.Error())
		return "", err
	}

	// Run `data/{xId}.wls`
	r, err := m.execMma(cmd.Raw, []string{
		"-file",
		scriptFile,
	}, cancel)
	if err != nil {
		return "", err
	}

	// Drop file `data/{xId}.wls`
	err = os.Remove(scriptFile)
	if err != nil {
		return "", err
	}

	return string(r), nil
}
