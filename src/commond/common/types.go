package common

import (
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"
)

// ExeContext is type:cId
type ExeContext interface {
	GetCommandID() string
	GetKind() string
}

// RawCommand from amqp
type RawCommand struct {
	CommandID string
	Kind      string
	Data      []byte
}

// StatusReport to amqp
type StatusReport struct {
	CommandID string                 `json:"-"`
	Kind      string                 `json:"-"`
	Cpu       []cpu.TimesStat        `json:"cpu"`
	Mem       *mem.VirtualMemoryStat `json:"mem"`
}

func (o StatusReport) GetCommandID() string { return o.CommandID }
func (o StatusReport) GetKind() string      { return o.Kind }

// LogReport to amqp
type LogReport struct {
	CommandID string `json:"-"`
	Kind      string `json:"-"`
	Level     string `json:"level"`
	Source    string `json:"source"`
	Data      string `json:"data"`
}

// CancelControl subscribe or unsubscribe cancelling
type CancelControl struct {
	CommandID string
	Enable    bool
}
