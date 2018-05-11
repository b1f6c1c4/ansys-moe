package rlang

import (
	"commond/common"

	null "gopkg.in/guregu/null.v3"
)

type rlangCommand struct {
	Raw    *common.RawCommand
	Script null.String `json:"script"`
}

type rlangAction struct {
	CommandID string      `json:"-"`
	Kind      string      `json:"-"`
	Cfg       string      `json:"-"`
	Type      string      `json:"type"`
	Result    null.String `json:"result"`
}

// GetCommandID make rlangAction an ExeContext
func (o rlangAction) GetCommandID() string { return o.CommandID }

// GetKind make rlangAction an ExeContext
func (o rlangAction) GetKind() string { return o.Kind }

// GetCfg make rlangAction an ExeContext
func (o rlangAction) GetCfg() string { return o.Cfg }

type executor interface {
	Run(rpt chan<- *rlangAction, cancel <-chan struct{}) error
}
