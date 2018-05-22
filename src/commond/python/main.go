package python

import (
	"commond/common"
	"encoding/json"
	"fmt"

	null "gopkg.in/guregu/null.v3"
)

// Module run kind=python
type Module struct {
	pythonPath        string
	rpt               chan<- common.ExeContext
	subscribeCancel   func(common.ExeContext, chan struct{})
	unsubscribeCancel func(common.ExeContext)
}

// GetCommandID make Module an ExeContext
func (m Module) GetCommandID() string { return "" }

// GetKind make Module an ExeContext
func (m Module) GetKind() string { return "python" }

// GetCfg make Module an ExeContext
func (m Module) GetCfg() string { return "" }

// NewModule setup python
func NewModule(
	rpt chan<- common.ExeContext,
	sub func(common.ExeContext, chan struct{}),
	unsub func(common.ExeContext),
) *Module {
	pythonPath := findPythonExecutable()
	m := &Module{pythonPath, rpt, sub, unsub}
	common.RL.Info(m, "python", "Python path: "+pythonPath)
	return m
}

// Run parse and execute a command
func (m Module) Run(raw *common.RawCommand) {
	defer raw.Ack()
	result := &pythonAction{
		CommandID: raw.GetCommandID(),
		Kind:      raw.GetKind(),
		Cfg:       raw.GetCfg(),
		Type:      "failure",
	}
	defer func() {
		if r := recover(); r != nil {
			common.RL.Error(raw, "python", fmt.Sprintf("Recovered panic: %v", r))
		}
		if result.Type == "cancel" {
			common.RL.Warn(raw, "python", "Command execution canceled")
		} else if result.Type != "done" {
			common.RL.Error(raw, "python", "Command execution failure")
		} else {
			common.RL.Notice(raw, "python", "Command execution done")
		}
		m.rpt <- result
	}()

	var cmd pythonCommand
	err := json.Unmarshal(raw.Data, &cmd)
	cmd.Raw = raw
	if err != nil {
		common.RL.Error(raw, "python", "Unmarshaling json: "+err.Error())
		return
	}

	cancel := make(chan struct{})
	m.subscribeCancel(raw, cancel)
	defer func() {
		m.unsubscribeCancel(raw)
	}()

	r, err := m.run(&cmd, cancel)
	select {
	case _, ok := <-cancel:
		if !ok {
			result.Type = "cancel"
		}
	default:
		if err == nil {
			result.Type = "done"
			result.Result = null.StringFrom(r)
		}
	}
}
