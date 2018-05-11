package common

// ExeContext is type:cId
type ExeContext interface {
	GetCommandID() string
	GetKind() string
	GetCfg() string
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
	Cfg       string
	Data      []byte
	Ack       func()
}

// GetCommandID make RawCommand an ExeContext
func (o RawCommand) GetCommandID() string { return o.CommandID }

// GetKind make RawCommand an ExeContext
func (o RawCommand) GetKind() string { return o.Kind }

// GetCfg make RawCommand an ExeContext
func (o RawCommand) GetCfg() string { return o.Cfg }

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
	CommandID string    `json:"cId"`
	Kind      string    `json:"kind"`
	Cfg       string    `json:"cfg"`
	Meta      *MetaInfo `json:"meta"`
	Level     string    `json:"level"`
	Label     string    `json:"label"`
	Message   string    `json:"message"`
}
