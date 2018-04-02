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

func watchLog(fn string, cmd *ansysCommand, cancel <-chan struct{}) error {
	common.RL.Info(cmd.Raw, "ansys/watchLog", "Watching log file")
	file, err := os.OpenFile(fn, os.O_RDONLY|os.O_CREATE, os.ModePerm)
	if err != nil {
		common.RL.Error(cmd.Raw, "ansys/watchLog", "Open log file: " + err.Error())
		return err
	}
	var pos int64
	for {
		_, err = file.Seek(pos, 0)
		if err != nil {
			common.RL.Error(cmd.Raw, "ansys/watchLog", "Seek log file: " + err.Error())
			return err
		}
		buf := bufio.NewReader(file)
		scanner := bufio.NewScanner(buf)
		for scanner.Scan() {
			q := scanner.Text()
			common.RL.Debug(cmd.Raw, "ansys/PIPE", q)
		}
		err = scanner.Err()
		if err != nil {
			common.RL.Error(cmd.Raw, "ansys/watchLog", "Read log file: " + err.Error())
			return err
		}
		pos, err = file.Seek(0, 1)
		if err != nil {
			common.RL.Error(cmd.Raw, "ansys/watchLog", "Seek log file: " + err.Error())
			return err
		}
		select {
		case <-cancel:
			return nil
		case <-time.After(time.Second):
		}
	}
}

func execAnsys(args []string, cmd *ansysCommand, rpt chan<- *ansysAction, cancel <-chan struct{}) error {
	ctx := exec.ansysCommand(ansysPath, args...)
	args := strings.Join(args, " ")
	common.RL.Info(cmd.Raw, "ansys/execAnsys", "Will execute: " + args)
	err := ctx.Start()
	if err != nil {
		common.RL.Error(cmd.Raw, "ansys/execAnsys", "execution of " + args + ": " + err.Error())
		return err
	}

	done := make(chan error, 1)
	go func() {
		done <- ctx.Wait()
	}()
	select {
	case <-cancel:
		common.RL.Info(cmd.Raw, "ansys/execAnsys", "Killing process")
		err := ctx.Process.Kill()
		if err != nil {
			common.RL.Error(cmd.Raw, "ansys/execAnsys", "Killing process: " + err.Error())
			return err
		}
		common.RL.Info(cmd.Raw, "ansys/execAnsys", "Process killed")
	case err := <-done:
		common.RL.Info(cmd.Raw, "ansys/execAnsys", "Process exited")
		if err != nil {
			common.RL.Error(cmd.Raw, "ansys/execAnsys", "Process exited: " + err.Error())
			return err
		}
	}
}

type runMutate struct {
	cmd *ansysCommand
}

func (r runMutate) Run(rpt chan<- *ansysAction, cancel <-chan struct{}) error {
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

	jobFile := filepath.Join(dataPath, jobID, fileName)
	_, err := os.Stat(jobFile)
	if err != nil {
		common.RL.Error(r.cmd, "check existance", err)
		return
	}

	scriptFile := filepath.Join(dataPath, jobID, "scripts", r.cmd.CommandID+".vbs")
	err = ioutil.WriteFile(scriptFile, []byte(script), os.ModePerm)
	if err != nil {
		common.RL.Error(r.cmd, "save script", err)
		return
	}

	logFile := filepath.Join(dataPath, jobID, "logs", r.cmd.CommandID+".log")
	go watchLog(logFile, r.cmd, rpt, cancel)

	args := []string{
		"-ng",
		"-logfile",
		logFile,
		"-runscript",
		scriptFile,
		"-batchsave",
		jobFile,
	}
	execAnsys(args, r.cmd, rpt, cancel)
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

	jobFile := filepath.Join(dataPath, jobID, fileName)
	_, err := os.Stat(jobFile)
	if err != nil {
		common.RL.Error(r.cmd, "check existance", err)
		return
	}

	logFile := filepath.Join(dataPath, jobID, "logs", r.cmd.CommandID+".log")
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

	jobFile := filepath.Join(dataPath, jobID, fileName)
	_, err := os.Stat(jobFile)
	if err != nil {
		common.RL.Error(r.cmd, "check existance", err)
		return
	}

	outputPath := filepath.Join(dataPath, jobID, "output", r.cmd.CommandID)
	err = os.MkdirAll(outputPath, os.ModePerm)
	if err != nil {
		common.RL.Error(r.cmd, "prepare output path", err)
	}

	// In VBScript, only '"' needs to be escaped.
	scriptX := strings.Replace(script, "$OUT_DIR", strings.Replace(outputPath, "\"", "\"\"", -1), -1)

	scriptFile := filepath.Join(dataPath, jobID, "scripts", r.cmd.CommandID+".vbs")
	err = ioutil.WriteFile(scriptFile, []byte(scriptX), os.ModePerm)
	if err != nil {
		common.RL.Error(r.cmd, "save script", err)
		return
	}

	logFile := filepath.Join(dataPath, jobID, "logs", r.cmd.CommandID+".log")
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
