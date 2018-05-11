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
	RemoteUrl     string `yaml:"url"`
	RabbitUrl     string `yaml:"mq"`
	LogUrl        string `yaml:"log"`
	PrefetchAnsys int    `yaml:"ansys"`
	PrefetchMma   int    `yaml:"mathematica"`
	PrefetchRLang int    `yaml:"rlang"`
	PathAnsys     string `yaml:"ansysPath"`
	PathMma       string `yaml:"mmaPath"`
	PathRLang     string `yaml:"rlangPath"`
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
	cfg.LogUrl = fmt.Sprintf(
		"%s:%s",
		os.Getenv("LOG_HOST"),
		os.Getenv("LOG_PORT"),
	)
	cfg.PrefetchAnsys, _ = strconv.Atoi(os.Getenv("ANSYS"))
	cfg.PrefetchMma, _ = strconv.Atoi(os.Getenv("MATHEMATICA"))
	cfg.PrefetchRLang, _ = strconv.Atoi(os.Getenv("RLANG"))
	cfg.PathAnsys = os.Getenv("ANSYS_PATH")
	cfg.PathMma = os.Getenv("MATHEMATICA_PATH")
	cfg.PathRLang = os.Getenv("RLANG_PATH")
	txt, err := ioutil.ReadFile(filepath.Join(exeDir, "config.yaml"))
	if err != nil {
		RL.Error(Core, "config", "Cannot open config.yaml")
		return cfg
	}
	err = yaml.Unmarshal(txt, &cfg)
	if err != nil {
		RL.Error(Core, "config", "Cannot parse config.yaml: "+err.Error())
		return cfg
	}
	return cfg
}
