package python

import (
	"commond/common"

	null "gopkg.in/guregu/null.v3"
)

type pythonCommand struct {
	Raw    *common.RawCommand
	Script null.String `json:"script"`
}

type pythonAction struct {
	CommandID string      `json:"-"`
	Kind      string      `json:"-"`
	Cfg       string      `json:"-"`
	Type      string      `json:"type"`
	Result    null.String `json:"result"`
}

// GetCommandID make pythonAction an ExeContext
func (o pythonAction) GetCommandID() string { return o.CommandID }

// GetKind make pythonAction an ExeContext
func (o pythonAction) GetKind() string { return o.Kind }

// GetCfg make pythonAction an ExeContext
func (o pythonAction) GetCfg() string { return o.Cfg }

type executor interface {
	Run(rpt chan<- *pythonAction, cancel <-chan struct{}) error
}
