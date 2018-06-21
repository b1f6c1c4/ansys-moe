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
	"fmt"
	"github.com/fatih/color"
	"time"
)

// RemoteLoggerT writes to remote logger
type RemoteLoggerT struct {
	Ch chan<- *LogReport
}

func writeLog(level string, p string, m string, colorize func(...interface{}) string) {
	ts := color.New(color.FgHiBlack).SprintFunc()
	SL(level, fmt.Sprintf(
		"%s [%s] %s: %s",
		ts(time.Now().UTC().Format(time.RFC3339)),
		p,
		colorize(level),
		colorize(m),
	))
}

// Trace is level=trace
func (l RemoteLoggerT) Trace(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), e.GetCfg(), &M, "trace", p, m}
}

// Debug is level=debug
func (l RemoteLoggerT) Debug(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), e.GetCfg(), &M, "debug", p, m}
}

// Info is level=info
func (l RemoteLoggerT) Info(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), e.GetCfg(), &M, "info", p, m}
}

// Notice is level=info and SL
func (l RemoteLoggerT) Notice(e ExeContext, p string, m string) {
	writeLog("info", p, m, color.New(color.FgGreen).SprintFunc())
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), e.GetCfg(), &M, "info", p, m}
}

// Warn is level=warn and SL
func (l RemoteLoggerT) Warn(e ExeContext, p string, m string) {
	writeLog("warn", p, m, color.New(color.FgHiYellow).SprintFunc())
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), e.GetCfg(), &M, "warn", p, m}
}

// Error is level=error and SL
func (l RemoteLoggerT) Error(e ExeContext, p string, m string) {
	writeLog("error", p, m, color.New(color.FgHiRed).SprintFunc())
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), e.GetCfg(), &M, "error", p, m}
}

// Fatal is level=fatal and SL
func (l RemoteLoggerT) Fatal(e ExeContext, p string, m string) {
	writeLog("fatal", p, m, color.New(color.FgRed, color.Underline).SprintFunc())
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), e.GetCfg(), &M, "fatal", p, m}
}
