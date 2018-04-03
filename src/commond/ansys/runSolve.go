package ansys

import (
	"commond/common"
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func (m Module) runSolve(cmd *ansysCommand, cancel <-chan struct{}) error {
	id := cmd.Raw.CommandID
	common.RL.Info(cmd.Raw, "ansys/runSolve", "Command started")

	if !cmd.File.Valid {
		err := errors.New("file")
		common.RL.Error(cmd.Raw, "ansys/runSolve", "Parse input: "+err.Error())
		return err
	}
	file := cmd.File.String
	fileName := filepath.Base(file)
	if !cmd.Script.Valid {
		err := errors.New("script")
		common.RL.Error(cmd.Raw, "ansys/runSolve", "Parse input: "+err.Error())
		return err
	}
	script := cmd.Script.String

	// Create `data/{cId}/output`
	err := common.EnsurePath(cmd.Raw, filepath.Join(id, "output"))
	if err != nil {
		return err
	}

	// Download `storage/{file}` to `data/{cId}/{file.name}`
	err = common.Download(cmd.Raw, file, filepath.Join(id, fileName))
	if err != nil {
		return err
	}

	// Log to `data/{cId}/solve.log`
	logFile := filepath.Join(common.DataPath, id, "solve.log")
	go common.WatchLog(cmd.Raw, logFile, cancel)

	// Run `batchsolve` over `data/{cId}/{file.name}`
	jobFile := filepath.Join(common.DataPath, id, fileName)
	err = m.execAnsys(cmd.Raw, []string{
		"-ng",
		"-logfile",
		logFile,
		"-batchsolve",
		jobFile,
	}, cancel)
	if err != nil {
		return err
	}

	// Report system status and log difference
	go func() {
		m, _ := time.ParseDuration("60s")
		for {
			select {
			case <-time.After(m):
				common.SR.Report(cmd.Raw)
			case <-cancel:
				return
			}
		}
	}()

	// Replace `$OUT_DIR` in `script` to `data/{cId}/output`
	// In VBScript, only '"' needs to be escaped.
	outputPath := filepath.Join(common.DataPath, id, "output")
	scriptX := strings.Replace(script, "$OUT_DIR", strings.Replace(outputPath, "\"", "\"\"", -1), -1)

	// Save `script` to `data/{cId}/script.vbs`
	scriptFile := filepath.Join(common.DataPath, id, "script.vbs")
	err = ioutil.WriteFile(scriptFile, []byte(scriptX), os.ModePerm)
	if err != nil {
		common.RL.Error(cmd.Raw, "ansys/runExtract", "Save script: "+err.Error())
		return err
	}

	// Log to `data/{cId}/extract.log`
	logFile = filepath.Join(common.DataPath, id, "extract.log")
	go common.WatchLog(cmd.Raw, logFile, cancel)

	// Run `batchextract` over `data/{cId}/{file.name}`
	err = m.execAnsys(cmd.Raw, []string{
		"-ng",
		"-logfile",
		logFile,
		"-runscript",
		scriptFile,
		"-batchextract",
		jobFile,
	}, cancel)
	if err != nil {
		return err
	}

	// Upload `data/{cId}/` to `storage/{cId}/`
	err = common.UploadDir(cmd.Raw, id, id)
	if err != nil {
		return err
	}

	// Drop directory `data/{cId}/`
	err = common.DropDir(cmd.Raw, id)
	if err != nil {
		return err
	}

	return nil
}
