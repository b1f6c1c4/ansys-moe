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
