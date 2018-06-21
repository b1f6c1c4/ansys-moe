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
package ansys

import (
	"commond/common"
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/teris-io/shortid"
)

func (m Module) run(cmd *ansysCommand, cancel <-chan struct{}) error {
	id := cmd.Raw.CommandID + "." + shortid.MustGenerate()
	common.RL.Info(cmd.Raw, "ansys/run", "Command started")

	if !cmd.Source.Valid {
		err := errors.New("source")
		common.RL.Error(cmd.Raw, "ansys/run", "Parse input: "+err.Error())
		return err
	}
	source := cmd.Source.String
	if !cmd.Destination.Valid {
		err := errors.New("destination")
		common.RL.Error(cmd.Raw, "ansys/run", "Parse input: "+err.Error())
		return err
	}
	destination := cmd.Destination.String
	if !cmd.Script.Valid {
		err := errors.New("script")
		common.RL.Error(cmd.Raw, "ansys/run", "Parse input: "+err.Error())
		return err
	}
	script := cmd.Script.String

	// Create `data/{xId}/output`
	err := common.EmptyPath(cmd.Raw, id, "output")
	if err != nil {
		return err
	}

	// Download `storage/{source}` to `data/{xId}/{destination}`
	err = common.Download(cmd.Raw, source, filepath.Join(id, destination))
	if err != nil {
		return err
	}

	// Replace `$OUT_DIR` in `script` to `data/{xId}/output`
	// In VBScript, only '"' needs to be escaped.
	outputPath := filepath.Join(common.DataPath, id, "output")
	scriptX := strings.Replace(script, "$OUT_DIR", strings.Replace(outputPath, "\"", "\"\"", -1), -1)

	// Save `script` to `data/{xId}/script.vbs`
	scriptFile := filepath.Join(common.DataPath, id, "script.vbs")
	err = ioutil.WriteFile(scriptFile, []byte(scriptX), os.ModePerm)
	if err != nil {
		common.RL.Error(cmd.Raw, "ansys/run", "Save script: "+err.Error())
		return err
	}

	logCancel := make(chan struct{})

	// Log to `data/{xId}/solve.log`
	logFile := filepath.Join(common.DataPath, id, "solve.log")
	go common.WatchLog(cmd.Raw, logFile, logCancel)

	// Run `batchsave` over `data/{xId}/{destination}`
	jobFile := filepath.Join(common.DataPath, id, destination)
	err = m.execAnsys(cmd.Raw, []string{
		"-ng",
		"-logfile",
		logFile,
		"-runscript",
		scriptFile,
		"-batchsave",
		jobFile,
	}, cancel)
	close(logCancel)
	if err != nil {
		return err
	}

	// Upload `data/{xId}/` to `storage/{cId}/`
	var ignorePattern *regexp.Regexp
	if common.C.PartialUpload {
		ignorePattern = regexp.MustCompile(`\.(?:aedt|mxwl)results$`)
	}
	err = common.UploadDir(cmd.Raw, cmd.Raw.CommandID, id, ignorePattern)
	if err != nil {
		return err
	}

	<-time.After(2 * time.Second)

	// Drop directory `data/{xId}/`
	if !common.C.PartialUpload {
		err = common.DropDir(cmd.Raw, id)
		if err != nil {
			return err
		}
	}

	return nil
}
