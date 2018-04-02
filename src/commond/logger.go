package commond

type remoteLogger struct {
	Ch chan *LogReport
}

func (l remoteLogger) Error(e ExeContext, p string, m string) {
	l.Ch <- &LogReport{e.getCommandID(), e.getKind(), "error", p, m}
}
