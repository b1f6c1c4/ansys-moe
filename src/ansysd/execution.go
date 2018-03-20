package ansysd

import (
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/hpcloud/tail"

	cp "github.com/cleversoap/go-cp"
	null "gopkg.in/guregu/null.v3"
)

func executeAnsys(job *Job, reports chan<- *Report, finished chan<- bool) {
	defer func() {
		finished <- true
	}()
	log := func(s string) {
		logger("#" + job.Name + ": " + s)
	}

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

	if !job.Script.IsZero() {
		scriptFile := filepath.Join(tempDir, "script.vbs")
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
		args = append(args, "-runscript", scriptFile)
	}

	if job.Arguments != nil {
		args = append(args, job.Arguments...)
	}
	args = append(args, "-batchsolve", jobFile)

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
		go func() {
			for line := range t.Lines {
				reports <- &Report{
					Name: job.Name,
					Log:  null.StringFrom(line.Text),
				}
			}
		}()
	}

	cmd := exec.Command(ansysPath, args...)
	log("To execute: " + ansysPath + " " + strings.Join(args, " "))
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
	if tailObj != nil {
		tailObj.Stop()
	}
	reports <- &Report{
		Name:     job.Name,
		Finished: true,
		Success:  true,
	}
}
