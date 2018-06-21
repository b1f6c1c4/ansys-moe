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
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/teris-io/shortid"
)

func (m Module) run(cmd *pythonCommand, cancel <-chan struct{}) (string, error) {
	id := cmd.Raw.CommandID + "." + shortid.MustGenerate()
	common.RL.Info(cmd.Raw, "python/run", "Command started")

	if !cmd.Script.Valid {
		err := errors.New("script")
		common.RL.Error(cmd.Raw, "python/run", "Parse input: "+err.Error())
		return "", err
	}
	script := cmd.Script.String

	// Save `script` to `data/{xId}.py`
	scriptFile := filepath.Join(common.DataPath, id+".py")
	err := ioutil.WriteFile(scriptFile, []byte(script), os.ModePerm)
	if err != nil {
		common.RL.Error(cmd.Raw, "python/run", "Save script: "+err.Error())
		return "", err
	}

	// Run `data/{xId}.R`
	r, err := m.execPython(cmd.Raw, []string{
		scriptFile,
	}, cancel)
	if err != nil {
		return "", err
	}

	// Drop file `data/{xId}.py`
	err = os.Remove(scriptFile)
	if err != nil {
		return "", err
	}

	return string(r), nil
}
