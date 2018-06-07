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
	RemoteUrl      string `yaml:"url"`
	RabbitUrl      string `yaml:"mq"`
	LogUrl         string `yaml:"log"`
	PrefetchAnsys  int    `yaml:"ansys"`
	PrefetchPython int    `yaml:"python"`
	PrefetchMma    int    `yaml:"mathematica"`
	PrefetchRLang  int    `yaml:"rlang"`
	PathAnsys      string `yaml:"ansysPath"`
	PathPython     string `yaml:"pythonPath"`
	PathMma        string `yaml:"mmaPath"`
	PathRLang      string `yaml:"rlangPath"`
	PartialUpload  bool   `yaml:"partialUpload"`
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
	cfg.PrefetchPython, _ = strconv.Atoi(os.Getenv("PYTHON"))
	cfg.PrefetchMma, _ = strconv.Atoi(os.Getenv("MATHEMATICA"))
	cfg.PrefetchRLang, _ = strconv.Atoi(os.Getenv("RLANG"))
	cfg.PathAnsys = os.Getenv("ANSYS_PATH")
	cfg.PathPython = os.Getenv("PYTHON_PATH")
	cfg.PathMma = os.Getenv("MATHEMATICA_PATH")
	cfg.PathRLang = os.Getenv("RLANG_PATH")
	cfg.PartialUpload = os.Getenv("PARTIAL_UPLOAD") != ""
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
