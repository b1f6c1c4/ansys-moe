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
package common

import (
	"os"
	"path/filepath"
)

// Core is kind=core
var Core ExeContext

// DataPath is ./data
var DataPath string

// SL writes to console or Windows events
var SL func(string, string)

// RL writes to remote logger
var RL RemoteLoggerT

// C stores ./config.yaml
var C GlobalConfigT

// M stores meta info
var M MetaInfo

// Entry setup commond
func Entry(theLogger func(string, string), log chan<- *LogReport) {
	Core = &RawCommand{"", "core", "", nil, nil}
	SL = theLogger
	RL = RemoteLoggerT{log}

	M.Component = "ansys-commond"
	M.Hostname, _ = os.Hostname()
	M.Pid = os.Getpid()

	exeDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		panic(err)
	}
	DataPath = filepath.Join(exeDir, "data")
	_ = os.MkdirAll(DataPath, os.ModePerm)
	C = loadConfig(exeDir)
}
