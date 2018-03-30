package commond

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
)

type runDownload struct {
	cmd *Command
}

func (r runDownload) Run(rpt chan<- *Report, cancel <-chan struct{}) {
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

	out, err := os.Create(filepath.Join(dataPath, jobID, fileName))
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "create file", err)
		return
	}
	defer out.Close()

	resp, err := http.Get(globalConfig.RemoteUrl + "raw/" + fileName)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "create http", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		rpt <- makeErrorReport(r.cmd, "status code", errors.New(strconv.Itoa(resp.StatusCode)))
		return
	}

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "copy stream", err)
		return
	}
}

type runCreateJob struct {
	cmd *Command
}

func (r runCreateJob) Run(rpt chan<- *Report, cancel <-chan struct{}) {
	if !r.cmd.JobID.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("jobId"))
		return
	}
	jobID := r.cmd.JobID.String

	err := os.Mkdir(filepath.Join(dataPath, jobID), os.ModePerm)
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "create folder", err)
		return
	}
}

type runDrop struct {
	cmd *Command
}

func (r runDrop) Run(rpt chan<- *Report, cancel <-chan struct{}) {
	if !r.cmd.JobID.Valid {
		rpt <- makeErrorReport(r.cmd, "parse input", errors.New("jobId"))
		return
	}
	jobID := r.cmd.JobID.String

	if !r.cmd.FileName.Valid {
		err := os.RemoveAll(filepath.Join(dataPath, jobID))
		if err != nil {
			rpt <- makeErrorReport(r.cmd, "remove folder", err)
			return
		}
		return
	}

	fileName := r.cmd.FileName.String
	err := os.RemoveAll(filepath.Join(dataPath, jobID, fileName))
	if err != nil {
		rpt <- makeErrorReport(r.cmd, "remove folder", err)
		return
	}
}
