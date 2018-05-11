package ansys

import (
	"commond/common"

	null "gopkg.in/guregu/null.v3"
)

type ansysCommand struct {
	Raw         *common.RawCommand
	Source      null.String `json:"source"`
	Destination null.String `json:"destination"`
	Script      null.String `json:"script"`
}

type ansysAction struct {
	CommandID string `json:"-"`
	Kind      string `json:"-"`
	Cfg       string `json:"-"`
	Type      string `json:"type"`
}

// GetCommandID make ansysAction an ExeContext
func (o ansysAction) GetCommandID() string { return o.CommandID }

// GetKind make ansysAction an ExeContext
func (o ansysAction) GetKind() string { return o.Kind }

// GetCfg make ansysAction an ExeContext
func (o ansysAction) GetCfg() string { return o.Cfg }

type executor interface {
	Run(rpt chan<- *ansysAction, cancel <-chan struct{}) error
}
