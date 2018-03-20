package ansysd

import (
	null "gopkg.in/guregu/null.v3"
)

// Job describes an Ansys Maxwell execution
type Job struct {
	Name      string
	Script    null.String
	FileName  string
	Arguments null.String
	Graphical bool
}

// Report describes job execution status
type Report struct {
	Name     string
	Finished bool
	Success  bool
	Error    null.String
}
