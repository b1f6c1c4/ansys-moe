package common

import (
	"syscall"
	"os/exec"
)

// PrepareKiller prepare a process for killing it
func PrepareKiller(ctx *exec.Cmd) {
	ctx.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
}

// RunKiller kills a process and its descents
func RunKiller(ctx *exec.Cmd) error {
	if ctx.Process == nil {
		return nil
	}
	pid := ctx.Process.Pid
	return syscall.Kill(-pid, syscall.SIGKILL)
}
