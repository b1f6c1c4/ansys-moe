package ansysd

import (
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/hpcloud/tail"

	cp "github.com/cleversoap/go-cp"
	null "gopkg.in/guregu/null.v3"
)

func executeAnsys(job *Job, reports chan<- *Report, finished chan<- bool) {
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
	}

	tempFile := filepath.Join(tempDir, job.FileName)
	if err := cp.Copy(rawFile, tempFile); err != nil {
		str := "Copy job file failed: " + err.Error()
		log(str)
		reports <- &Report{
			Name:     job.Name,
			Finished: true,
			Error:    null.StringFrom(str),
		}
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
		}
		args = append(args, "-runscript", scriptFile)
	}

	if job.Arguments != nil {
		args = append(args, job.Arguments...)
	}

	var tailObj *tail.Tail
	cmd := exec.Command(ansysPath, args...)
	go func() {
		if t, err := tail.TailFile(logFile, tail.Config{Follow: true}); err != nil {
			str := "Tail file failed: " + err.Error()
			log(str)
			reports <- &Report{
				Name:  job.Name,
				Error: null.StringFrom(str),
			}
		} else {
			tailObj = t
			for line := range t.Lines {
				reports <- &Report{
					Name: job.Name,
					Log:  null.StringFrom(line.Text),
				}
			}
		}
	}()
	go func() {
		cmd.Wait()
		tailObj.Stop()
		finished <- true
	}()
}
