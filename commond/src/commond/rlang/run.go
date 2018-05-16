package rlang

import (
	"commond/common"
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/teris-io/shortid"
)

func (m Module) run(cmd *rlangCommand, cancel <-chan struct{}) (string, error) {
	id := cmd.Raw.CommandID + "." + shortid.MustGenerate()
	common.RL.Info(cmd.Raw, "rlang/run", "Command started")

	if !cmd.Script.Valid {
		err := errors.New("script")
		common.RL.Error(cmd.Raw, "rlang/run", "Parse input: "+err.Error())
		return "", err
	}
	script := cmd.Script.String

	// Save `script` to `data/{xId}.R`
	scriptFile := filepath.Join(common.DataPath, id+".R")
	err := ioutil.WriteFile(scriptFile, []byte(script), os.ModePerm)
	if err != nil {
		common.RL.Error(cmd.Raw, "rlang/run", "Save script: "+err.Error())
		return "", err
	}

	// Run `data/{xId}.R`
	r, err := m.execRLang(cmd.Raw, []string{
		"--vanilla",
		scriptFile,
	}, cancel)
	if err != nil {
		return "", err
	}

	// Drop file `data/{xId}.R`
	err = os.Remove(scriptFile)
	if err != nil {
		return "", err
	}

	return string(r), nil
}
