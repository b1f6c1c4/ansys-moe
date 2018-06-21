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
