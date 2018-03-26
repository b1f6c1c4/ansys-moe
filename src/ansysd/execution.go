package ansysd

import (
	// "io/ioutil"
	"os"
	"strconv"
	"os/exec"
	// "path/filepath"
	"strings"
	"time"
	"bufio"

	// "github.com/hpcloud/tail"

	// cp "github.com/cleversoap/go-cp"
	// null "gopkg.in/guregu/null.v3"
)

func watchLog(fn string, cmd *Command, rpt chan<- *Report, cancel <-chan struct{}) {
	file, err := os.OpenFile(fn, os.O_RDONLY | os.O_CREATE, os.ModePerm)
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
			Type: "log",
			Data: []byte(str),
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
			break;
		}
	}
}

func execAnsys(args []string, cmd *Command, rpt chan<- *Report, cancel <-chan struct{}) {
	ctx := exec.Command(ansysPath, args...)
	logger("To execute: " + ansysPath + " " + strings.Join(args, " "))
	err := ctx.Start()
	if err != nil {
		rpt <- makeErrorReport(cmd, "execution of " + strings.Join(args, " "), err)
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
		} else {
			rpt <- makeFinishedReport(cmd)
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
	_, err = os.Stat(jobFile)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "check existance", err)
		return
	}

	scriptFile := filepath.Join(dataPath, jobID, "scripts", cmd.CommandID + ".vbs")
	err := ioutil.WriteFile(scriptFile, []byte(script), os.ModePerm)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "save script", err)
		return
	}

	logFile := filepath.Join(dataPath, jobID, "logs", cmd.CommandID + ".log")
	go watchLog(logFile, cmd, rpt, cancel)

	args := []string{
		"-ng",
		"-logfile",
		logFile,
		"-runscript",
		scriptFile,
		"-batchsave",
		jobFile,
	}
	execAnsys(args, cmd, rpt, cancel)
}

// func checkSucc(errors <-chan struct{}) bool {
// 	<-time.After(time.Second)
// 	succ := true
// 	for {
// 		select {
// 		case <-errors:
// 			succ = false
// 			break
// 		default:
// 			return succ
// 		}
// 	}
// }
//
// func executeAnsys(job *Job, rpt chan<- *Report, finished chan<- struct{}) {
// 	defer close(finished)
// 	log := func(s string) {
// 		logger("#" + job.Name + ": " + s)
// 	}
// 	defer log("finished")
//
// 	rawFile := filepath.Join(dataPath, "raw", job.FileName)
//
// 	tempDir := filepath.Join(dataPath, "temp", job.Name)
// 	if err := os.Mkdir(tempDir, os.ModePerm); err != nil {
// 		str := "Make temp dir failed: " + err.Error()
// 		log(str)
// 		rpt <- &Report{
// 			Name:     job.Name,
// 			Finished: true,
// 			Error:    null.StringFrom(str),
// 		}
// 		return
// 	}
//
// 	jobFile := filepath.Join(tempDir, job.FileName)
// 	if err := cp.Copy(rawFile, jobFile); err != nil {
// 		str := "Copy job file failed: " + err.Error()
// 		log(str)
// 		rpt <- &Report{
// 			Name:     job.Name,
// 			Finished: true,
// 			Error:    null.StringFrom(str),
// 		}
// 		return
// 	}
//
// 	logFile := filepath.Join(tempDir, "job.log")
// 	args := []string{"-ng", "-logfile", logFile}
//
// 	if job.Arguments != nil {
// 		args = append(args, job.Arguments...)
// 	}
//
// 	errors := make(chan struct{})
// 	var tailObj *tail.Tail
// 	if t, err := tail.TailFile(logFile, tail.Config{Follow: true}); err != nil {
// 		str := "Tail file failed: " + err.Error()
// 		log(str)
// 		rpt <- &Report{
// 			Name:  job.Name,
// 			Error: null.StringFrom(str),
// 		}
// 	} else {
// 		tailObj = t
// 		defer tailObj.Stop()
// 		go func() {
// 			for line := range t.Lines {
// 				if strings.HasPrefix(line.Text, "[error]") {
// 					errors <- struct{}{}
// 				}
// 				rpt <- &Report{
// 					Name: job.Name,
// 					Log:  null.StringFrom(line.Text),
// 				}
// 			}
// 		}()
// 	}
//
// 	if !job.Script.IsZero() {
// 		scriptFile := filepath.Join(tempDir, "script.py")
// 		if err := ioutil.WriteFile(scriptFile, []byte(job.Script.ValueOrZero()), os.ModePerm); err != nil {
// 			str := "Write script file failed: " + err.Error()
// 			log(str)
// 			rpt <- &Report{
// 				Name:     job.Name,
// 				Finished: true,
// 				Error:    null.StringFrom(str),
// 			}
// 			return
// 		}
// 		argsS := append(args, "-runscript", scriptFile, "-batchsave", jobFile)
// 		cmd := exec.Command(ansysPath, argsS...)
// 		log("To execute: " + ansysPath + " " + strings.Join(argsS, " "))
// 		if err := cmd.Run(); err != nil {
// 			str := "Save execution failed: " + err.Error()
// 			log(str)
// 			rpt <- &Report{
// 				Name:     job.Name,
// 				Finished: true,
// 				Error:    null.StringFrom(str),
// 			}
// 			return
// 		}
// 		if !checkSucc(errors) {
// 			rpt <- &Report{
// 				Name:     job.Name,
// 				Finished: true,
// 				Error:    null.StringFrom("Scripting"),
// 			}
// 			return
// 		}
// 	}
//
// 	argsE := append(args, "-batchsolve", jobFile)
// 	rpt <- &Report{
// 		Name:     job.Name,
// 		Finished: true,
// 		Success:  checkSucc(errors),
// 		Error:    null.StringFrom("Solving"),
// 	}
// }
