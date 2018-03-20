package ansysd

import (
	"io/ioutil"
	"os"
	"path/filepath"

	cp "github.com/cleversoap/go-cp"
	null "gopkg.in/guregu/null.v3"
)

func executeAnsys(job Job, reports chan<- *Report) {
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
			Success:  false,
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
			Success:  false,
			Error:    null.StringFrom(str),
		}
	}

	var scriptFile string
	if job.Script.IsZero() {
		scriptFile = filepath.Join(tempDir, "script.vbs")
		if err := ioutil.WriteFile(scriptFile, []byte(job.Script.ValueOrZero()), os.ModePerm); err != nil {
			str := "Write script file failed: " + err.Error()
			log(str)
			reports <- &Report{
				Name:     job.Name,
				Finished: true,
				Success:  false,
				Error:    null.StringFrom(str),
			}
		}
	}
}
