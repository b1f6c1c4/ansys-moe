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
