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
