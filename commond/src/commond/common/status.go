package common

import (
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"
)

// StatusReporter reports to amqp
type StatusReporter struct {
	Ch chan<- *StatusReport
}

// Report reports status
func (l StatusReporter) Report(e ExeContext) {
	cs, _ := cpu.Times(false)
	m, _ := mem.VirtualMemory()
	l.Ch <- &StatusReport{
		CommandID: e.GetCommandID(),
		Kind:      e.GetKind(),
		Cpu:       cs,
		Mem:       m,
	}
}

// ReportP reports process status
func (l StatusReporter) ReportP(e ExeContext, p interface{}) {
	l.Ch <- &StatusReport{
		CommandID: e.GetCommandID(),
		Kind:      e.GetKind(),
		Usage:     p,
	}
}
