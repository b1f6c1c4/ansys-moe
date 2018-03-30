package commond

import (
	yaml "gopkg.in/yaml.v2"
	"io/ioutil"
	"path/filepath"
)

type globalConfigT struct {
	RemoteUrl    string `yaml:"url"`
	WebsocketUrl string `yaml:"ws"`
}

func loadConfig(exeDir string) globalConfigT {
	cfg := globalConfigT{}
	txt, err := ioutil.ReadFile(filepath.Join(exeDir, "config.yaml"))
	if err != nil {
		logger("Cannot open config.yaml")
		return cfg
	}
	err = yaml.Unmarshal(txt, &cfg)
	if err != nil {
		logger("Cannot parse config.yaml: " + err.Error())
		return cfg
	}
	return cfg
}
