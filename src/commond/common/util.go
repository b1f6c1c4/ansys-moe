package common

import (
	"bufio"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

// EnsurePath is mkdir -p
func EnsurePath(e ExeContext, path string) error {
	err := os.Mkdir(filepath.Join(DataPath, path), os.ModePerm)
	if err != nil {
		RL.Error(e, "ensurePath", "Create folder: "+err.Error())
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
			RL.Debug(e, "ansys/PIPE", q)
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
			return nil
		case <-time.After(time.Second):
		}
	}
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

// UploadDir a dir from data path to remote
func UploadDir(e ExeContext, remote string, local string) error {
	// func reportDir(e ExeContext, rpt chan<- *ansysAction, relPath string, absPath string) {
	// 	files, err := ioutil.ReadDir(absPath)
	// 	if err != nil {
	// 		common.RL.Error(e, "read dir", err)
	// 		return
	// 	}
	// 	for _, f := range files {
	// 		var nRelPath string
	// 		if len(relPath) == 0 {
	// 			nRelPath = f.Name()
	// 		} else {
	// 			nRelPath = relPath + "/" + f.Name()
	// 		}
	// 		nAbsPath := filepath.Join(absPath, f.Name())
	// 		if f.IsDir() {
	// 			reportDir(e, rpt, nRelPath, nAbsPath)
	// 		} else {
	// 			c, err := ioutil.ReadFile(nAbsPath)
	// 			if err != nil {
	// 				common.RL.Error(e, "read file", err)
	// 			} else {
	// 				rpt <- makeFileReport(e, f.Name(), null.StringFrom(string(c)))
	// 			}
	// 		}
	// 	}
	// }
	return errors.New("Not implemented") // TODO
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
