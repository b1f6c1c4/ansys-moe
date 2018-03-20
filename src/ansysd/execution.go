package ansysd

import (
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/hpcloud/tail"

	cp "github.com/cleversoap/go-cp"
	null "gopkg.in/guregu/null.v3"
)

func checkSucc(errors <-chan struct{}) bool {
	<-time.After(time.Second)
	succ := true
	for {
		select {
		case <-errors:
			succ = false
			break
		default:
			return succ
		}
	}
}

func executeAnsys(job *Job, reports chan<- *Report, finished chan<- struct{}) {
	defer close(finished)
	log := func(s string) {
		logger("#" + job.Name + ": " + s)
	}
	defer log("finished")

	rawFile := filepath.Join(dataPath, "raw", job.FileName)

	tempDir := filepath.Join(dataPath, "temp", job.Name)
	if err := os.Mkdir(tempDir, os.ModePerm); err != nil {
		str := "Make temp dir failed: " + err.Error()
		log(str)
		reports <- &Report{
			Name:     job.Name,
			Finished: true,
			Error:    null.StringFrom(str),
		}
		return
	}

	jobFile := filepath.Join(tempDir, job.FileName)
	if err := cp.Copy(rawFile, jobFile); err != nil {
		str := "Copy job file failed: " + err.Error()
		log(str)
		reports <- &Report{
			Name:     job.Name,
			Finished: true,
			Error:    null.StringFrom(str),
		}
		return
	}

	logFile := filepath.Join(tempDir, "job.log")
	args := []string{"-ng", "-logfile", logFile}

	if job.Arguments != nil {
		args = append(args, job.Arguments...)
	}

	errors := make(chan struct{})
	var tailObj *tail.Tail
	if t, err := tail.TailFile(logFile, tail.Config{Follow: true}); err != nil {
		str := "Tail file failed: " + err.Error()
		log(str)
		reports <- &Report{
			Name:  job.Name,
			Error: null.StringFrom(str),
		}
	} else {
		tailObj = t
		defer tailObj.Stop()
		go func() {
			for line := range t.Lines {
				if strings.HasPrefix(line.Text, "[error]") {
					errors <- struct{}{}
				}
				reports <- &Report{
					Name: job.Name,
					Log:  null.StringFrom(line.Text),
				}
			}
		}()
	}

	if !job.Script.IsZero() {
		scriptFile := filepath.Join(tempDir, "script.py")
		if err := ioutil.WriteFile(scriptFile, []byte(job.Script.ValueOrZero()), os.ModePerm); err != nil {
			str := "Write script file failed: " + err.Error()
			log(str)
			reports <- &Report{
				Name:     job.Name,
				Finished: true,
				Error:    null.StringFrom(str),
			}
			return
		}
		argsS := append(args, "-runscript", scriptFile, "-batchsave", jobFile)
		cmd := exec.Command(ansysPath, argsS...)
		log("To execute: " + ansysPath + " " + strings.Join(argsS, " "))
		if err := cmd.Run(); err != nil {
			str := "Save execution failed: " + err.Error()
			log(str)
			reports <- &Report{
				Name:     job.Name,
				Finished: true,
				Error:    null.StringFrom(str),
			}
			return
		}
		if !checkSucc(errors) {
			reports <- &Report{
				Name:     job.Name,
				Finished: true,
				Error:    null.StringFrom("Scripting"),
			}
			return
		}
	}

	argsE := append(args, "-batchsolve", jobFile)
	cmd := exec.Command(ansysPath, argsE...)
	log("To execute: " + ansysPath + " " + strings.Join(argsE, " "))
	if err := cmd.Run(); err != nil {
		str := "Execution failed: " + err.Error()
		log(str)
		reports <- &Report{
			Name:     job.Name,
			Finished: true,
			Error:    null.StringFrom(str),
		}
		return
	}
	reports <- &Report{
		Name:     job.Name,
		Finished: true,
		Success:  checkSucc(errors),
		Error:    null.StringFrom("Solving"),
	}
}
