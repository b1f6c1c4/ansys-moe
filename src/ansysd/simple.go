package ansysd

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
)

type runDownload struct {
	cmd Command
}

func (r runDownload) Run(rpt chan<- *Report, cancel <-chan struct{}) {
	out, err := os.Create(filepath.Join(dataPath, r.cmd.JobID.ValueOrZero(), r.cmd.FileName.ValueOrZero()))
	if err != nil {
		rpt <- makeErrorReport(&r.cmd, "create file", err)
		return
	}
	defer out.Close()

	resp, err := http.Get(remotePath + "raw/" + r.cmd.FileName.ValueOrZero())
	if err != nil {
		rpt <- makeErrorReport(&r.cmd, "create http", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		rpt <- makeErrorReport(&r.cmd, "status code", errors.New(strconv.Itoa(resp.StatusCode)))
		return
	}

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		rpt <- makeErrorReport(&r.cmd, "copy stream", err)
		return
	}

	rpt <- makeFinishedReport(&r.cmd)
}
