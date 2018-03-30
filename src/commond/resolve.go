package commond

import (
	"os"
)

var possiblePaths = []string{
	"C:\\Program Files\\AnsysEM\\AnsysEM15.0\\Win64\\maxwell.exe",
	"D:\\Program Files\\AnsysEM\\AnsysEM18.0\\Win64\\ansysedt.exe",
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
