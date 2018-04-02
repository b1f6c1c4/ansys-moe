package ansys

import (
	"commond/common"
	"errors"
	"path/filepath"
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

	// Create `data/{cId}`
	err := common.EnsurePath(cmd.Raw, id)
	if err != nil {
		return err
	}

	// Download `storage/{file}` to `data/{cId}/{file.name}`
	err = common.Download(cmd.Raw, file, filepath.Join(id, fileName))
	if err != nil {
		return err
	}

	// Log to `data/{cId}/ansys.log`
	logFile := filepath.Join(common.DataPath, id, "ansys.log")
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
