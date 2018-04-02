package common

import (
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"
)

// NewStatusReport create a status report
func NewStatusReport(e ExeContext) *StatusReport {
	cs, _ := cpu.Times(false)
	m, _ := mem.VirtualMemory()
	return &StatusReport{
		CommandID: e.GetCommandID(),
		Kind:      e.GetKind(),
		Cpu:       cs,
		Mem:       m,
	}
}
