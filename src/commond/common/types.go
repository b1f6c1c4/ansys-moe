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

// Module is a kind executor
type Module interface {
	ExeContext
	Run(raw *RawCommand)
}

// RawCommand from amqp
type RawCommand struct {
	CommandID string
	Kind      string
	Data      []byte
	Ack       func()
}

// GetCommandID make RawCommand an ExeContext
func (o RawCommand) GetCommandID() string { return o.CommandID }

// GetKind make RawCommand an ExeContext
func (o RawCommand) GetKind() string { return o.Kind }

// StatusReport to amqp
type StatusReport struct {
	CommandID string                 `json:"-"`
	Kind      string                 `json:"-"`
	Cpu       []cpu.TimesStat        `json:"cpu"`
	Mem       *mem.VirtualMemoryStat `json:"mem"`
	Usage     interface{}            `json:"usage"`
}

// GetCommandID make StatusReport an ExeContext
func (o StatusReport) GetCommandID() string { return o.CommandID }

// GetKind make StatusReport an ExeContext
func (o StatusReport) GetKind() string { return o.Kind }

// VersionInfo about build
type VersionInfo struct {
	Version    string `json:"version"`
	CommitHash string `json:"commitHash"`
}

// MetaInfo about process
type MetaInfo struct {
	Component string      `json:"component"`
	Hostname  string      `json:"hostname"`
	Pid       int         `json:"pid"`
	Version   VersionInfo `json:"version"`
}

// LogReport to amqp
type LogReport struct {
	CommandID string    `json:"-"`
	Kind      string    `json:"-"`
	Meta      *MetaInfo `json:"meta"`
	Level     string    `json:"level"`
	Label     string    `json:"label"`
	Message   string    `json:"message"`
}
