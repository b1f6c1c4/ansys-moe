package common

import (
	"fmt"
	yaml "gopkg.in/yaml.v2"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
)

// GlobalConfigT describes ./config.yaml
type GlobalConfigT struct {
	RemoteUrl   string `yaml:"url"`
	RabbitUrl   string `yaml:"mq"`
	Prefetch    int    `yaml:"prefetch"`
	EnableAnsys bool   `yaml:"ansys"`
	EnableMma   bool   `yaml:"mathematica"`
	EnableRLang bool   `yaml:"rlang"`
}

func loadConfig(exeDir string) GlobalConfigT {
	cfg := GlobalConfigT{}
	cfg.RemoteUrl = os.Getenv("REMOTE_URL")
	cfg.RabbitUrl = fmt.Sprintf(
		"amqp://%s:%s@%s:%s/",
		os.Getenv("RABBIT_USER"),
		os.Getenv("RABBIT_PASS"),
		os.Getenv("RABBIT_HOST"),
		os.Getenv("RABBIT_PORT"),
	)
	cfg.Prefetch, _ = strconv.Atoi(os.Getenv("PREFETCH"))
	cfg.EnableAnsys = os.Getenv("ANSYS") != ""
	cfg.EnableMma = os.Getenv("MATHEMATICA") != ""
	cfg.EnableRLang = os.Getenv("RLANG") != ""
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
