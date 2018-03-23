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
	j, _ := json.Marshal(map[string]interface{}{
		"phase":   phase,
		"message": err.Error(),
	})
	return &Report{
		CommandID: cmd.CommandID,
		Type:      "errored",
		Data:      j,
	}
}
