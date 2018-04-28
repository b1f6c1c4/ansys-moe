package common

import (
	"bufio"
	"bytes"
	"errors"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

// EmptyPath is rm -rf && mkdir -p
func EmptyPath(e ExeContext, path, subPath string) error {
	p := filepath.Join(DataPath, path)
	err := os.RemoveAll(p)
	if err != nil {
		RL.Error(e, "emptyPath", "Remove folder: "+err.Error())
		return err
	}
	err = os.MkdirAll(filepath.Join(p, subPath), os.ModePerm)
	if err != nil {
		RL.Error(e, "emptyPath", "Create folder: "+err.Error())
		return err
	}
	return nil
}

// WatchLog report file difference to pipe
func WatchLog(e ExeContext, fn string, cancel <-chan struct{}) error {
	RL.Info(e, "watchLog", "Watching log file")
	file, err := os.OpenFile(fn, os.O_RDONLY|os.O_CREATE, os.ModePerm)
	if err != nil {
		RL.Error(e, "watchLog", "Open log file: "+err.Error())
		return err
	}
	defer file.Close()
	var pos int64
	for {
		_, err = file.Seek(pos, 0)
		if err != nil {
			RL.Error(e, "watchLog", "Seek log file: "+err.Error())
			return err
		}
		buf := bufio.NewReader(file)
		scanner := bufio.NewScanner(buf)
		for scanner.Scan() {
			q := scanner.Text()
			RL.Debug(e, e.GetKind() + "/PIPE", q)
		}
		err = scanner.Err()
		if err != nil {
			RL.Error(e, "watchLog", "Read log file: "+err.Error())
			return err
		}
		pos, err = file.Seek(0, 1)
		if err != nil {
			RL.Error(e, "watchLog", "Seek log file: "+err.Error())
			return err
		}
		select {
		case <-cancel:
			RL.Trace(e, "watchLog", "Done")
			return nil
		case <-time.After(time.Second):
		}
	}
}

// PipeLog report pipe to pipe
func PipeLog(e ExeContext, raw io.Reader) {
	buf := bufio.NewReader(raw)
	scanner := bufio.NewScanner(buf)
	for scanner.Scan() {
		q := scanner.Text()
		RL.Debug(e, e.GetKind() + "/PIPE", q)
	}
	RL.Trace(e, "pipeLog", "Done")
}

// Download a file from remote to data path
func Download(e ExeContext, remote string, local string) error {
	RL.Debug(e, "download", "Download "+remote+" to "+local)

	path := filepath.Join(DataPath, local)
	RL.Trace(e, "download", "Local path: "+path)
	out, err := os.Create(path)
	if err != nil {
		RL.Error(e, "download", "Create file: "+err.Error())
		return err
	}
	defer out.Close()

	url := C.RemoteUrl + "storage/" + remote
	RL.Trace(e, "download", "Remote url: "+url)
	resp, err := http.Get(url)
	if err != nil {
		RL.Error(e, "download", "Create http: "+err.Error())
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		err := errors.New(strconv.Itoa(resp.StatusCode))
		RL.Error(e, "download", "Status code: "+err.Error())
		return err
	}

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		RL.Error(e, "download", "Copy stream: "+err.Error())
		return err
	}
	RL.Trace(e, "download", "Downloaded "+remote+" to "+local)
	return nil
}

func upload(e ExeContext, remote, local string, writer *multipart.Writer) error {
	RL.Debug(e, "upload", "Will upload "+remote)
	file, err := os.Open(local)
	if err != nil {
		RL.Error(e, "upload", "Open file: "+err.Error())
		return err
	}
	defer file.Close()

	part, err := writer.CreateFormFile(remote, remote)
	if err != nil {
		RL.Error(e, "upload", "Create form file: "+err.Error())
		return err
	}

	_, err = io.Copy(part, file)
	if err != nil {
		RL.Error(e, "upload", "Copy stream: "+err.Error())
		return err
	}
	return nil
}

func uploadDir(e ExeContext, remote, local string, writer *multipart.Writer) error {
	files, err := ioutil.ReadDir(local)
	if err != nil {
		RL.Error(e, "uploadDir", "Read dir: "+err.Error())
		return err
	}
	for _, f := range files {
		nr := remote + "/" + f.Name()
		nl := filepath.Join(local, f.Name())
		if f.IsDir() {
			err = uploadDir(e, nr, nl, writer)
		} else {
			err = upload(e, nr, nl, writer)
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// UploadDir a dir from data path to remote
func UploadDir(e ExeContext, remote, local string) error {
	RL.Debug(e, "uploadDir", "Will upload data/"+local+" to storage/"+remote)
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	err := uploadDir(e, remote, filepath.Join(DataPath, local), writer)
	if err != nil {
		return err
	}

	err = writer.Close()
	if err != nil {
		RL.Error(e, "uploadDir", "Close writer: "+err.Error())
		return err
	}

	req, err := http.NewRequest("POST", C.RemoteUrl+"storage/", body)
	if err != nil {
		RL.Error(e, "uploadDir", "Make request: "+err.Error())
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		RL.Error(e, "uploadDir", "Do request: "+err.Error())
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 204 {
		err = errors.New("StatusCode " + strconv.Itoa(resp.StatusCode))
		RL.Error(e, "uploadDir", err.Error())
		return err
	}

	RL.Info(e, "uploadDir", "Uploaded data/"+local+" to storage/"+remote)
	return nil
}

// DropDir remove the whole folder
func DropDir(e ExeContext, path string) error {
	err := os.RemoveAll(filepath.Join(DataPath, path))
	if err != nil {
		RL.Error(e, "dropDir", "Remove folder: "+err.Error())
		return err
	}
	return nil
}
