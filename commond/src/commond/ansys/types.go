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

	null "gopkg.in/guregu/null.v3"
)

type ansysCommand struct {
	Raw         *common.RawCommand
	Source      null.String `json:"source"`
	Destination null.String `json:"destination"`
	Script      null.String `json:"script"`
}

type ansysAction struct {
	CommandID string `json:"-"`
	Kind      string `json:"-"`
	Cfg       string `json:"-"`
	Type      string `json:"type"`
}

// GetCommandID make ansysAction an ExeContext
func (o ansysAction) GetCommandID() string { return o.CommandID }

// GetKind make ansysAction an ExeContext
func (o ansysAction) GetKind() string { return o.Kind }

// GetCfg make ansysAction an ExeContext
func (o ansysAction) GetCfg() string { return o.Cfg }

type executor interface {
	Run(rpt chan<- *ansysAction, cancel <-chan struct{}) error
}
