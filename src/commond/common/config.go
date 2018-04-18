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
	PrefetchAnsys int    `yaml:"ansys"`
	PrefetchMma   int    `yaml:"mathematica"`
	PrefetchRLang int    `yaml:"rlang"`
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
	cfg.PrefetchAnsys, _ = strconv.Atoi(os.Getenv("ANSYS"))
	cfg.PrefetchMma, _ = strconv.Atoi(os.Getenv("MATHEMATICA"))
	cfg.PrefetchRLang, _ = strconv.Atoi(os.Getenv("RLANG"))
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
