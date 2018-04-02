package ansys

import (
	"bufio"
	"errors"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	null "gopkg.in/guregu/null.v3"
)

func execAnsys(e ExeContext, args []string, cancel <-chan struct{}) error {
	ctx := exec.ansysCommand(ansysPath, args...)
	args := strings.Join(args, " ")
	common.RL.Info(e, "ansys/execAnsys", "Will execute: " + args)
	err := ctx.Start()
	if err != nil {
		common.RL.Error(e, "ansys/execAnsys", "execution of " + args + ": " + err.Error())
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
			common.RL.Error(e, "ansys/execAnsys", "Killing process: " + err.Error())
			return err
		}
		common.RL.Info(e, "ansys/execAnsys", "Process killed")
	case err := <-done:
		common.RL.Info(e, "ansys/execAnsys", "Process exited")
		if err != nil {
			common.RL.Error(e, "ansys/execAnsys", "Process exited: " + err.Error())
			return err
		}
	}
}

type runMutate struct {
	cmd *ansysCommand
}

func (r runMutate) Run(rpt chan<- *ansysAction, cancel <-chan struct{}) error {
	id := r.cmd.Raw.CommandID
	if !r.cmd.File.Valid {
		err := errors.New("file")
		common.RL.Error(r.cmd.Raw, "ansys/runMutate", "Parse input: " + err.Error())
		return err
	}
	file := r.cmd.File.String
	fileName := filepath.Base(file)
	if !r.cmd.Script.Valid {
		err := errors.New("script")
		common.RL.Error(r.cmd.Raw, "ansys/runMutate", "Parse input: " + err.Error())
		return err
	}
	script := r.cmd.Script.String

	// Create `data/{cId}`
	err := common.EnsurePath(r.cmd.Raw, id)
	if err != nil {
		return err
	}

    // Download `storage/{file}` to `data/{cId}/{file.name}`
	err = common.Download(r.cmd.Raw, file, filepath.Join(id, file.name))
	if err != nil {
		return err
	}

    // Save `script` to `data/{cId}/script.vbs`
	scriptFile := filepath.Join(common.DataPath, id, "script.vbs")
	err = ioutil.WriteFile(scriptFile, []byte(script), os.ModePerm)
	if err != nil {
		common.RL.Error(r.cmd.Raw, "ansys/runMutate", "Save script: " + err.Error())
		return err
	}

    // Log to `data/{cId}/ansys.log`
	logFile := filepath.Join(common.DataPath, id, "ansys.log")
	go watchLog(r.cmd.Raw, logFile, cancel)

    // Run `batchsave` over `data/{cId}/{file.name}`
	err = execAnsys(r.cmd.Raw, []string{
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
	err = common.UploadDir(id, id)
	if err != nil {
		return err
	}

    // Drop directory `data/{cId}/`
	err = common.DropDir(id)
	if err != nil {
		return err
	}

	return nil
}

type runSolve struct {
	cmd *ansysCommand
}

func (r runSolve) Run(rpt chan<- *ansysAction, cancel <-chan struct{}) {
	if !r.cmd.JobID.Valid {
		common.RL.Error(r.cmd, "parse input", errors.New("jobId"))
		return
	}
	jobID := r.cmd.JobID.String
	if !r.cmd.FileName.Valid {
		common.RL.Error(r.cmd, "parse input", errors.New("fileName"))
		return
	}
	fileName := r.cmd.FileName.String

	jobFile := filepath.Join(common.DataPath, jobID, fileName)
	_, err := os.Stat(jobFile)
	if err != nil {
		common.RL.Error(r.cmd, "check existance", err)
		return
	}

	logFile := filepath.Join(common.DataPath, jobID, "logs", r.cmd.CommandID+".log")
	go watchLog(logFile, r.cmd, rpt, cancel)

	args := []string{
		"-ng",
		"-logfile",
		logFile,
		"-batchsolve",
		jobFile,
	}
	execAnsys(args, r.cmd, rpt, cancel)
}

func reportDir(cmd *ansysCommand, rpt chan<- *ansysAction, relPath string, absPath string) {
	files, err := ioutil.ReadDir(absPath)
	if err != nil {
		common.RL.Error(cmd, "read dir", err)
		return
	}
	for _, f := range files {
		var nRelPath string
		if len(relPath) == 0 {
			nRelPath = f.Name()
		} else {
			nRelPath = relPath + "/" + f.Name()
		}
		nAbsPath := filepath.Join(absPath, f.Name())
		if f.IsDir() {
			reportDir(cmd, rpt, nRelPath, nAbsPath)
		} else {
			c, err := ioutil.ReadFile(nAbsPath)
			if err != nil {
				common.RL.Error(cmd, "read file", err)
			} else {
				rpt <- makeFileReport(cmd, f.Name(), null.StringFrom(string(c)))
			}
		}
	}
}

type runExtract struct {
	cmd *ansysCommand
}

func (r runExtract) Run(rpt chan<- *ansysAction, cancel <-chan struct{}) {
	if !r.cmd.JobID.Valid {
		common.RL.Error(r.cmd, "parse input", errors.New("jobId"))
		return
	}
	jobID := r.cmd.JobID.String
	if !r.cmd.FileName.Valid {
		common.RL.Error(r.cmd, "parse input", errors.New("fileName"))
		return
	}
	fileName := r.cmd.FileName.String
	if !r.cmd.Script.Valid {
		common.RL.Error(r.cmd, "parse input", errors.New("script"))
		return
	}
	script := r.cmd.Script.String

	jobFile := filepath.Join(common.DataPath, jobID, fileName)
	_, err := os.Stat(jobFile)
	if err != nil {
		common.RL.Error(r.cmd, "check existance", err)
		return
	}

	outputPath := filepath.Join(common.DataPath, jobID, "output", r.cmd.CommandID)
	err = os.MkdirAll(outputPath, os.ModePerm)
	if err != nil {
		common.RL.Error(r.cmd, "prepare output path", err)
	}

	// In VBScript, only '"' needs to be escaped.
	scriptX := strings.Replace(script, "$OUT_DIR", strings.Replace(outputPath, "\"", "\"\"", -1), -1)

	scriptFile := filepath.Join(common.DataPath, jobID, "scripts", r.cmd.CommandID+".vbs")
	err = ioutil.WriteFile(scriptFile, []byte(scriptX), os.ModePerm)
	if err != nil {
		common.RL.Error(r.cmd, "save script", err)
		return
	}

	logFile := filepath.Join(common.DataPath, jobID, "logs", r.cmd.CommandID+".log")
	go watchLog(logFile, r.cmd, rpt, cancel)

	args := []string{
		"-ng",
		"-logfile",
		logFile,
		"-runscript",
		scriptFile,
		"-batchextract",
		jobFile,
	}
	execAnsys(args, r.cmd, rpt, cancel)

	reportDir(r.cmd, rpt, "", outputPath)
}
