package ansysd

import (
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
	Data      string
}

type executor interface {
	Run(cmd Command, rpt chan<- Report, cancel <-chan struct{})
}
