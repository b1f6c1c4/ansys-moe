package commond

import (
	"commond/common"
)

type remoteLogger struct {
	Ch chan *common.LogReport
}

func (l remoteLogger) Error(e common.ExeContext, p string, m string) {
	l.Ch <- &common.LogReport{e.GetCommandID(), e.GetKind(), "error", p, m}
}
