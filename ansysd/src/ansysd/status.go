package ansysd

import (
	"encoding/json"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"
)

func makeStatusReport(cmd *Command) *Report {
	cs, _ := cpu.Times(false)
	m, _ := mem.VirtualMemory()
	j, _ := json.Marshal(map[string]interface{}{
		"cpu": cs,
		"mem": m,
	})
	return &Report{
		CommandID: cmd.CommandID,
		Type:      "status",
		Data:      j,
	}
}
