package common

// RemoteLoggerT writes to amqp
type RemoteLoggerT struct {
	Ch chan *LogReport
}

func (l RemoteLoggerT) Error(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.GetCommandID(), e.GetKind(), "error", p, m}
}
