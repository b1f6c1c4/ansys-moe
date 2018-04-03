package common

import (
	yaml "gopkg.in/yaml.v2"
	"io/ioutil"
	"path/filepath"
)

// GlobalConfigT describes ./config.yaml
type GlobalConfigT struct {
	RemoteUrl   string `yaml:"url"`
	RabbitUrl   string `yaml:"mq"`
	Prefetch    int    `yaml:"prefetch"`
	EnableAnsys bool   `yaml:"ansys"`
	EnableMma   bool   `yaml:"mathematica"`
}

func loadConfig(exeDir string) GlobalConfigT {
	cfg := GlobalConfigT{}
	txt, err := ioutil.ReadFile(filepath.Join(exeDir, "config.yaml"))
	if err != nil {
		SL("Cannot open config.yaml")
		return cfg
	}
	err = yaml.Unmarshal(txt, &cfg)
	if err != nil {
		SL("Cannot parse config.yaml: " + err.Error())
		return cfg
	}
	return cfg
}
