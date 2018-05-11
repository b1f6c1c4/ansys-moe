package mma

import (
	"commond/common"

	null "gopkg.in/guregu/null.v3"
)

type mmaCommand struct {
	Raw    *common.RawCommand
	Script null.String `json:"script"`
}

type mmaAction struct {
	CommandID string      `json:"-"`
	Kind      string      `json:"-"`
	Cfg       string      `json:"-"`
	Type      string      `json:"type"`
	Result    null.String `json:"result"`
}

// GetCommandID make mmaAction an ExeContext
func (o mmaAction) GetCommandID() string { return o.CommandID }

// GetKind make mmaAction an ExeContext
func (o mmaAction) GetKind() string { return o.Kind }

// GetCfg make mmaAction an ExeContext
func (o mmaAction) GetCfg() string { return o.Cfg }

type executor interface {
	Run(rpt chan<- *mmaAction, cancel <-chan struct{}) error
}
