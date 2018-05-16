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
