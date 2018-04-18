package mma

import (
	"commond/common"
	"encoding/json"
	"fmt"

	null "gopkg.in/guregu/null.v3"
)

// Module run kind=mma
type Module struct {
	mmaPath           string
	rpt               chan<- common.ExeContext
	subscribeCancel   func(common.ExeContext, chan struct{})
	unsubscribeCancel func(common.ExeContext)
}

// GetCommandID make Module an ExeContext
func (m Module) GetCommandID() string { return "" }

// GetKind make Module an ExeContext
func (m Module) GetKind() string { return "mathematica" }

// NewModule setup mma
func NewModule(
	rpt chan<- common.ExeContext,
	sub func(common.ExeContext, chan struct{}),
	unsub func(common.ExeContext),
) *Module {
	mmaPath := findMmaExecutable()
	m := &Module{mmaPath, rpt, sub, unsub}
	common.RL.Info(m, "mma", "Mma path: "+mmaPath)
	return m
}

// Run parse and execute a command
func (m Module) Run(raw *common.RawCommand) {
	defer raw.Ack()
	result := &mmaAction{
		CommandID: raw.GetCommandID(),
		Kind:      raw.GetKind(),
		Type:      "failure",
	}
	defer func() {
		if r := recover(); r != nil {
			common.RL.Error(raw, "mma", fmt.Sprintf("Recovered panic: %v", r))
		}
		if result.Type != "done" {
			common.RL.Error(raw, "mma", "Command execution failure")
		} else {
			common.RL.Info(raw, "mma", "Command execution done")
		}
		m.rpt <- result
	}()

	var cmd mmaCommand
	err := json.Unmarshal(raw.Data, &cmd)
	cmd.Raw = raw
	if err != nil {
		common.RL.Error(raw, "mma", "Unmarshaling json: "+err.Error())
		return
	}

	cancel := make(chan struct{})
	m.subscribeCancel(raw, cancel)
	defer func() {
		m.unsubscribeCancel(raw)
	}()

	r, err := m.run(&cmd, cancel)
	if err == nil {
		result.Type = "done"
		result.Result = null.StringFrom(r)
	}
}
