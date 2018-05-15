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

func (m Module) run(cmd *ansysCommand, cancel <-chan struct{}) error {
	id := cmd.Raw.CommandID
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

	// Create `data/{cId}/output`
	err := common.EmptyPath(cmd.Raw, id, "output")
	if err != nil {
		return err
	}

	// Download `storage/{source}` to `data/{cId}/{destination}`
	err = common.Download(cmd.Raw, source, filepath.Join(id, destination))
	if err != nil {
		return err
	}

	// Replace `$OUT_DIR` in `script` to `data/{cId}/output`
	// In VBScript, only '"' needs to be escaped.
	outputPath := filepath.Join(common.DataPath, id, "output")
	scriptX := strings.Replace(script, "$OUT_DIR", strings.Replace(outputPath, "\"", "\"\"", -1), -1)

	// Save `script` to `data/{cId}/script.vbs`
	scriptFile := filepath.Join(common.DataPath, id, "script.vbs")
	err = ioutil.WriteFile(scriptFile, []byte(scriptX), os.ModePerm)
	if err != nil {
		common.RL.Error(cmd.Raw, "ansys/run", "Save script: "+err.Error())
		return err
	}

	logCancel := make(chan struct{})

	// Log to `data/{cId}/solve.log`
	logFile := filepath.Join(common.DataPath, id, "solve.log")
	go common.WatchLog(cmd.Raw, logFile, logCancel)

	// Run `batchsave` over `data/{cId}/{destination}`
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

	// Upload `data/{cId}/` to `storage/{cId}/`
	err = common.UploadDir(cmd.Raw, id, id)
	if err != nil {
		return err
	}

	<-time.After(2 * time.Second)

	// Drop directory `data/{cId}/`
	err = common.DropDir(cmd.Raw, id)
	if err != nil {
		return err
	}

	return nil
}