package ansysd

import (
	"encoding/json"

	null "gopkg.in/guregu/null.v3"
)

// Command from controller
type Command struct {
	CommandID string      `json:"cId"`
	Type      string      `json:"type"`
	JobID     null.String `json:"jId"`
	FileName  null.String `json:"fileName"`
	Script    null.String `json:"string"`
}

// Report to controller
type Report struct {
	CommandID string
	Type      string
	Data      []byte
}

type executor interface {
	Run(rpt chan<- *Report, cancel <-chan struct{})
}

func makeFinishedReport(cmd *Command) *Report {
	return &Report{
		CommandID: cmd.CommandID,
		Type:      "finished",
	}
}

func makeErrorReport(cmd *Command, phase string, err error) *Report {
	var j []byte
	if err != nil {
		j, _ = json.Marshal(map[string]interface{}{
			"phase":   phase,
			"message": err.Error(),
		})
	} else {
		j, _ = json.Marshal(map[string]interface{}{
			"phase": phase,
		})
	}
	return &Report{
		CommandID: cmd.CommandID,
		Type:      "errored",
		Data:      j,
	}
}

func makeFileReport(cmd *Command, name string, content null.String) *Report {
	j, _ := json.Marshal(map[string]interface{}{
		"fileName":    name,
		"fileContent": content,
	})
	return &Report{
		CommandID: cmd.CommandID,
		Type:      "errored",
		Data:      j,
	}
}
