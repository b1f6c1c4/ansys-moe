package common

import (
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"
)

// NewStatusReport create a status report
func NewStatusReport(cmd ExeContext) *StatusReport {
	cs, _ := cpu.Times(false)
	m, _ := mem.VirtualMemory()
	return &StatusReport{
		CommandID: cmd.GetCommandID(),
		Kind:      cmd.GetKind(),
		Cpu:       cs,
		Mem:       m,
	}
}
