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
package rlang

import (
	"commond/common"
	"encoding/json"
	"fmt"

	null "gopkg.in/guregu/null.v3"
)

// Module run kind=rlang
type Module struct {
	rlangPath         string
	rpt               chan<- common.ExeContext
	subscribeCancel   func(common.ExeContext, chan struct{})
	unsubscribeCancel func(common.ExeContext)
}

// GetCommandID make Module an ExeContext
func (m Module) GetCommandID() string { return "" }

// GetKind make Module an ExeContext
func (m Module) GetKind() string { return "rlang" }

// GetCfg make Module an ExeContext
func (m Module) GetCfg() string { return "" }

// NewModule setup rlang
func NewModule(
	rpt chan<- common.ExeContext,
	sub func(common.ExeContext, chan struct{}),
	unsub func(common.ExeContext),
) *Module {
	rlangPath := findRLangExecutable()
	m := &Module{rlangPath, rpt, sub, unsub}
	common.RL.Info(m, "rlang", "RLang path: "+rlangPath)
	return m
}

// Run parse and execute a command
func (m Module) Run(raw *common.RawCommand) {
	defer raw.Ack()
	result := &rlangAction{
		CommandID: raw.GetCommandID(),
		Kind:      raw.GetKind(),
		Cfg:       raw.GetCfg(),
		Type:      "failure",
	}
	defer func() {
		if r := recover(); r != nil {
			common.RL.Error(raw, "rlang", fmt.Sprintf("Recovered panic: %v", r))
		}
		if result.Type == "cancel" {
			common.RL.Warn(raw, "rlang", "Command execution canceled")
		} else if result.Type != "done" {
			common.RL.Error(raw, "rlang", "Command execution failure")
		} else {
			common.RL.Notice(raw, "rlang", "Command execution done")
		}
		m.rpt <- result
	}()

	var cmd rlangCommand
	err := json.Unmarshal(raw.Data, &cmd)
	cmd.Raw = raw
	if err != nil {
		common.RL.Error(raw, "rlang", "Unmarshaling json: "+err.Error())
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
