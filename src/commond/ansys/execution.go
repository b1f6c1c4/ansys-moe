package ansys

import (
	"commond/common"
	"errors"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func (m Module) execAnsys(e common.ExeContext, args []string, cancel <-chan struct{}) error {
	ctx := exec.Command(m.ansysPath, args...)
	jArgs := strings.Join(args, " ")
	common.RL.Info(e, "ansys/execAnsys", "Will execute: "+jArgs)
	err := ctx.Start()
	if err != nil {
		common.RL.Error(e, "ansys/execAnsys", "execution of "+jArgs+": "+err.Error())
		return err
	}

	done := make(chan error, 1)
	go func() {
		done <- ctx.Wait()
	}()
	select {
	case <-cancel:
		common.RL.Info(e, "ansys/execAnsys", "Killing process")
		err := ctx.Process.Kill()
		if err != nil {
			common.RL.Error(e, "ansys/execAnsys", "Killing process: "+err.Error())
			return err
		}
		common.RL.Info(e, "ansys/execAnsys", "Process killed")
	case err := <-done:
		common.RL.Info(e, "ansys/execAnsys", "Process exited")
		if err != nil {
			common.RL.Error(e, "ansys/execAnsys", "Process exited: "+err.Error())
			return err
		}
	}
	return nil
}

func (m Module) runMutate(cmd *ansysCommand, cancel <-chan struct{}) error {
	id := cmd.Raw.CommandID
	common.RL.Info(cmd.Raw, "ansys/runMutate", "Command started")

	if !cmd.File.Valid {
		err := errors.New("file")
		common.RL.Error(cmd.Raw, "ansys/runMutate", "Parse input: "+err.Error())
		return err
	}
	file := cmd.File.String
	fileName := filepath.Base(file)
	if !cmd.Script.Valid {
		err := errors.New("script")
		common.RL.Error(cmd.Raw, "ansys/runMutate", "Parse input: "+err.Error())
		return err
	}
	script := cmd.Script.String

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

	// Save `script` to `data/{cId}/script.vbs`
	scriptFile := filepath.Join(common.DataPath, id, "script.vbs")
	err = ioutil.WriteFile(scriptFile, []byte(script), os.ModePerm)
	if err != nil {
		common.RL.Error(cmd.Raw, "ansys/runMutate", "Save script: "+err.Error())
		return err
	}

	// Log to `data/{cId}/ansys.log`
	logFile := filepath.Join(common.DataPath, id, "ansys.log")
	go common.WatchLog(cmd.Raw, logFile, cancel)

	// Run `batchsave` over `data/{cId}/{file.name}`
	jobFile := filepath.Join(common.DataPath, id, fileName)
	err = m.execAnsys(cmd.Raw, []string{
		"-ng",
		"-logfile",
		logFile,
		"-runscript",
		scriptFile,
		"-batchsave",
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

// args := []string{
// 	"-ng",
// 	"-logfile",
// 	logFile,
// 	"-batchsolve",
// 	jobFile,
// }

// func reportDir(e ExeContext, rpt chan<- *ansysAction, relPath string, absPath string) {
// 	files, err := ioutil.ReadDir(absPath)
// 	if err != nil {
// 		common.RL.Error(e, "read dir", err)
// 		return
// 	}
// 	for _, f := range files {
// 		var nRelPath string
// 		if len(relPath) == 0 {
// 			nRelPath = f.Name()
// 		} else {
// 			nRelPath = relPath + "/" + f.Name()
// 		}
// 		nAbsPath := filepath.Join(absPath, f.Name())
// 		if f.IsDir() {
// 			reportDir(e, rpt, nRelPath, nAbsPath)
// 		} else {
// 			c, err := ioutil.ReadFile(nAbsPath)
// 			if err != nil {
// 				common.RL.Error(e, "read file", err)
// 			} else {
// 				rpt <- makeFileReport(e, f.Name(), null.StringFrom(string(c)))
// 			}
// 		}
// 	}
// }

// // In VBScript, only '"' needs to be escaped.
// scriptX := strings.Replace(script, "$OUT_DIR", strings.Replace(outputPath, "\"", "\"\"", -1), -1)

// args := []string{
// 	"-ng",
// 	"-logfile",
// 	logFile,
// 	"-runscript",
// 	scriptFile,
// 	"-batchextract",
// 	jobFile,
// }
// execAnsys(args, cmd, rpt, cancel)

// reportDir(cmd, rpt, "", outputPath)
