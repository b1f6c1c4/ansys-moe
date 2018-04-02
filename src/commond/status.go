package commond

import (
	"commond/common"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"
)

func makeStatusReport(cmd common.ExeContext) *common.StatusReport {
	cs, _ := cpu.Times(false)
	m, _ := mem.VirtualMemory()
	return &common.StatusReport{
		CommandID: cmd.GetCommandID(),
		Kind:      cmd.GetKind(),
		Cpu:       cs,
		Mem:       m,
	}
}
