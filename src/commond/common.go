package commond

import (
	"encoding/json"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"

	null "gopkg.in/guregu/null.v3"
)

// ExeContext is type:cId
type ExeContext interface {
	getCommandID() string
	getType() string
}

// RawCommand from amqp
type RawCommand struct {
	CommandID string
	Type      string
	Data      []byte
}

// StatusReport to amqp
type StatusReport struct {
	CommandID string                 `json:"-"`
	Type      string                 `json:"-"`
	Cpu       *cpu.TimesStat         `json:"cpu"`
	Mem       *mem.VirtualMemoryStat `json:"mem"`
}

func (o StatusReport) getCommandID() string { return o.CommandID }
func (o StatusReport) getType() string      { return o.Type }

// LogReport to amqp
type LogReport struct {
	CommandID string `json:"-"`
	Type      string `json:"-"`
	Level     string `json:"level"`
	Source    string `json:"source"`
	Data      string `json:"data"`
}

// CancelControl subscribe or unsubscribe cancelling
type CancelControl struct {
	CommandID string
	Enable    bool
}

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
