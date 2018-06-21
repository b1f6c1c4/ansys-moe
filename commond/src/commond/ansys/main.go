/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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

// GetCfg make Module an ExeContext
func (m Module) GetCfg() string { return "" }

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
		Cfg:       raw.GetCfg(),
		Type:      "failure",
	}
	defer func() {
		if r := recover(); r != nil {
			common.RL.Error(raw, "ansys", fmt.Sprintf("Recovered panic: %v", r))
		}
		if result.Type != "done" {
			common.RL.Error(raw, "ansys", "Command execution failure")
		} else {
			common.RL.Notice(raw, "ansys", "Command execution done")
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

	cancel := make(chan struct{})
	m.subscribeCancel(raw, cancel)
	defer func() {
		m.unsubscribeCancel(raw)
	}()

	err = m.run(&cmd, cancel)
	if err == nil {
		result.Type = "done"
	}
}
