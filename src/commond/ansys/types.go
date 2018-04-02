package ansys

import (
	"commond/common"
	"encoding/json"

	null "gopkg.in/guregu/null.v3"
)

type ansysCommand struct {
	Raw       *common.RawCommand
	Type      string `json:"type"`
	File      null.String `json:"file"`
	Script    null.String `json:"script"`
}

type ansysAction struct {
	CommandID string `json:"-"`
	Kind      string `json:"-"`
	Type      string `json:"type"`
}

type executor interface {
	Run(rpt chan<- *ansysAction, cancel <-chan struct{}) error
}
