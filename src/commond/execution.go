package commond

import (
	"bufio"
	"errors"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	null "gopkg.in/guregu/null.v3"
)

func watchLog(fn string, cmd *Command, rpt chan<- *Report, cancel <-chan struct{}) {
	file, err := os.OpenFile(fn, os.O_RDONLY|os.O_CREATE, os.ModePerm)
	if err != nil {
		rpt <- makeErrorReport(cmd, "open log file", err)
		return
	}
	var pos int64
	for {
		_, err = file.Seek(pos, 0)
		if err != nil {
			rpt <- makeErrorReport(cmd, "seek log file", err)
			return
		}
		buf := bufio.NewReader(file)
		scanner := bufio.NewScanner(buf)
		s := []string{}
		for scanner.Scan() {
			q := strconv.Quote(scanner.Text())
			s = append(s, q)
		}
		str := "[" + strings.Join(s, ",") + "]"
		rpt <- &Report{
			CommandID: cmd.CommandID,
			Type:      "log",
			Data:      []byte(str),
		}
		err = scanner.Err()
		if err != nil {
			rpt <- makeErrorReport(cmd, "read log file", err)
			return
		}
		pos, err = file.Seek(0, 1)
		if err != nil {
			rpt <- makeErrorReport(cmd, "seek log file", err)
			return
		}
		select {
		case <-cancel:
			return
		case <-time.After(time.Second):
		}
	}
}

func execAnsys(args []string, cmd *Command, rpt chan<- *Report, cancel <-chan struct{}) {
	ctx := exec.Command(ansysPath, args...)
	logger("To execute: " + ansysPath + " " + strings.Join(args, " "))
	err := ctx.Start()
	if err != nil {
		rpt <- makeErrorReport(cmd, "execution of "+strings.Join(args, " "), err)
		return
	}

	done := make(chan error, 1)
	go func() {
		done <- ctx.Wait()
	}()
	select {
	case <-cancel:
		err := ctx.Process.Kill()
		rpt <- makeErrorReport(cmd, "killed", err)
	case err := <-done:
		if err != nil {
			rpt <- makeErrorReport(cmd, "finish", err)
		}
	}
}

type runMutate struct {
	cmd *Command
}

func (r runMutate) Run(rpt chan<- *Report, cancel <-chan struct{}) {
	if !r.cmd.JobID.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("jobId"))
		return
	}
	jobID := r.cmd.JobID.String
	if !r.cmd.FileName.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("fileName"))
		return
	}
	fileName := r.cmd.FileName.String
	if !r.cmd.Script.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("script"))
		return
	}
	script := r.cmd.Script.String

	jobFile := filepath.Join(dataPath, jobID, fileName)
	_, err := os.Stat(jobFile)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "check existance", err)
		return
	}

	scriptFile := filepath.Join(dataPath, jobID, "scripts", r.cmd.CommandID+".vbs")
	err = ioutil.WriteFile(scriptFile, []byte(script), os.ModePerm)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "save script", err)
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
	cmd *Command
}

func (r runSolve) Run(rpt chan<- *Report, cancel <-chan struct{}) {
	if !r.cmd.JobID.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("jobId"))
		return
	}
	jobID := r.cmd.JobID.String
	if !r.cmd.FileName.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("fileName"))
		return
	}
	fileName := r.cmd.FileName.String

	jobFile := filepath.Join(dataPath, jobID, fileName)
	_, err := os.Stat(jobFile)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "check existance", err)
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

func reportDir(cmd *Command, rpt chan<- *Report, relPath string, absPath string) {
	files, err := ioutil.ReadDir(absPath)
	if err != nil {
		rpt <- makeErrorReport(cmd, "read dir", err)
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
				rpt <- makeErrorReport(cmd, "read file", err)
			} else {
				rpt <- makeFileReport(cmd, f.Name(), null.StringFrom(string(c)))
			}
		}
	}
}

type runExtract struct {
	cmd *Command
}

func (r runExtract) Run(rpt chan<- *Report, cancel <-chan struct{}) {
	if !r.cmd.JobID.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("jobId"))
		return
	}
	jobID := r.cmd.JobID.String
	if !r.cmd.FileName.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("fileName"))
		return
	}
	fileName := r.cmd.FileName.String
	if !r.cmd.Script.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("script"))
		return
	}
	script := r.cmd.Script.String

	jobFile := filepath.Join(dataPath, jobID, fileName)
	_, err := os.Stat(jobFile)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "check existance", err)
		return
	}

	outputPath := filepath.Join(dataPath, jobID, "output", r.cmd.CommandID)
	err = os.MkdirAll(outputPath, os.ModePerm)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "prepare output path", err)
	}

	// In VBScript, only '"' needs to be escaped.
	scriptX := strings.Replace(script, "$OUT_DIR", strings.Replace(outputPath, "\"", "\"\"", -1), -1)

	scriptFile := filepath.Join(dataPath, jobID, "scripts", r.cmd.CommandID+".vbs")
	err = ioutil.WriteFile(scriptFile, []byte(scriptX), os.ModePerm)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "save script", err)
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
