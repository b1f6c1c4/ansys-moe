package common

// RemoteLoggerT writes to amqp
type RemoteLoggerT struct {
	Ch chan<- *LogReport
}

// Trace is level=trace
func (l RemoteLoggerT) Trace(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), "trace", p, m}
}

// Debug is level=debug
func (l RemoteLoggerT) Debug(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), "debug", p, m}
}

// Info is level=info
func (l RemoteLoggerT) Info(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), "info", p, m}
}

// Warn is level=warn
func (l RemoteLoggerT) Warn(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), "warn", p, m}
}

// Error is level=error
func (l RemoteLoggerT) Error(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), "error", p, m}
}

// Fatal is level=fatal
func (l RemoteLoggerT) Fatal(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), "fatal", p, m}
}
