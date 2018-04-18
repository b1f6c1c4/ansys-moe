package ansys

import (
	"commond/common"
	"encoding/json"
	"fmt"
)

// Module run kind=ansys
type Module struct {
	ansysPath         string
	rpt               chan<- common.ExeContext
	subscribeCancel   func(common.ExeContext, chan struct{})
	unsubscribeCancel func(common.ExeContext)
}

// GetCommandID make Module an ExeContext
func (m Module) GetCommandID() string { return "" }

// GetKind make Module an ExeContext
func (m Module) GetKind() string { return "ansys" }

// NewModule setup ansys
func NewModule(
	rpt chan<- common.ExeContext,
	sub func(common.ExeContext, chan struct{}),
	unsub func(common.ExeContext),
) *Module {
	ansysPath := findAnsysExecutable()
	m := &Module{ansysPath, rpt, sub, unsub}
	common.RL.Info(m, "ansys", "Ansys path: "+ansysPath)
	return m
}

// Run parse and execute a command
func (m Module) Run(raw *common.RawCommand) {
	defer raw.Ack()
	result := &ansysAction{
		CommandID: raw.GetCommandID(),
		Kind:      raw.GetKind(),
		Type:      "failure",
	}
	defer func() {
		if r := recover(); r != nil {
			common.RL.Error(raw, "ansys", fmt.Sprintf("Recovered panic: %v", r))
		}
		if result.Type != "done" {
			common.RL.Error(raw, "ansys", "Command execution failure")
		} else {
			common.RL.Info(raw, "ansys", "Command execution done")
		}
		m.rpt <- result
	}()

	var cmd ansysCommand
	err := json.Unmarshal(raw.Data, &cmd)
	cmd.Raw = raw
	if err != nil {
		common.RL.Error(raw, "ansys", "Unmarshaling json: "+err.Error())
		return
	}

	var exe func(*ansysCommand, <-chan struct{}) error
	switch cmd.Type {
	case "mutate":
		exe = m.runMutate
	case "solve":
		exe = m.runSolve
	default:
		common.RL.Error(raw, "ansys", "Unsupported type: "+cmd.Type)
		return
	}

	cancel := make(chan struct{})
	m.subscribeCancel(raw, cancel)
	defer func() {
		m.unsubscribeCancel(raw)
	}()

	err = exe(&cmd, cancel)
	if err == nil {
		result.Type = "done"
	}
}
