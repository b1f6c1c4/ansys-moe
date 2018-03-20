package ansysd

import (
	"os"
)

var possiblePaths = []string{
	"C:\\Program Files\\AnsysEM\\AnsysEM15.0\\Win64\\maxwell.exe",
}

func findAnsysExecutable() string {
	for i := 0; i < len(possiblePaths); i++ {
		if _, err := os.Stat(possiblePaths[i]); err != nil {
			continue
		}
		return possiblePaths[i]
	}
	panic("Ansys executable not found")
}
