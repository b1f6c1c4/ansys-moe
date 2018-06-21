/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package commond

import (
	"commond/ansys"
	"commond/common"
	"commond/mma"
	"commond/python"
	"commond/rlang"
	"time"
)

// VERSION is defined during compilation
var VERSION string

// COMMITHASH is defined during compilation
var COMMITHASH string

var log chan *common.LogReport

func delayed(ch <-chan struct{}, m time.Duration) chan struct{} {
	c := make(chan struct{})
	go func() {
		select {
		case <-ch:
		}
		select {
		case <-time.After(m):
		}
		close(c)
	}()
	return c
}

// Entry setup commond
func Entry(theLogger func(string, string)) {
	common.M.Version.Version = VERSION
	common.M.Version.CommitHash = COMMITHASH
	log = make(chan *common.LogReport, 1000)
	common.Entry(theLogger, log)
	common.RL.Notice(common.Core, "main", "VERSION: "+VERSION)
	common.RL.Notice(common.Core, "main", "COMMITHASH: "+COMMITHASH)
}

func addModule(m common.Module, pref int, stop <-chan struct{}) {
	common.RL.Notice(common.Core, "main", "Adding module "+m.GetKind())
	ch := make(chan *common.RawCommand)
	err := subscribeCommand(m.GetKind(), pref, ch)
	if err != nil {
		panic(err)
	}
	common.RL.Info(m, "main", "Added module")
	go func() {
		for {
			select {
			case raw := <-ch:
				common.RL.Notice(common.Core, "main", "Received command of kind "+m.GetKind())
				go m.Run(raw)
			case <-stop:
				return
			}
		}
	}()
}

func wait() {
	select {
	case <-time.After(3 * time.Second):
	}
}

// Loop listen on events
func Loop(stop <-chan struct{}) {
	err := setupAmqp(delayed(stop, time.Second))
	if err != nil {
		panic(err)
	}
	common.RL.Notice(common.Core, "main", "Amqp Connected")

	go publishLog(log)

	act := make(chan common.ExeContext)
	go publishAction(act)

	common.RL.Info(common.Core, "main", "Start adding modules")

	if common.C.PrefetchAnsys > 0 {
		wait()
		addModule(ansys.NewModule(act, subscribeCancel, unsubscribeCancel), common.C.PrefetchAnsys, stop)
	}
	if common.C.PrefetchPython > 0 {
		wait()
		addModule(python.NewModule(act, subscribeCancel, unsubscribeCancel), common.C.PrefetchPython, stop)
	}
	if common.C.PrefetchMma > 0 {
		wait()
		addModule(mma.NewModule(act, subscribeCancel, unsubscribeCancel), common.C.PrefetchMma, stop)
	}
	if common.C.PrefetchRLang > 0 {
		wait()
		addModule(rlang.NewModule(act, subscribeCancel, unsubscribeCancel), common.C.PrefetchRLang, stop)
	}

	common.RL.Notice(common.Core, "main", "Started event loop")

	select {
	case <-stop:
		common.RL.Fatal(common.Core, "main", "Received signal to stop")
	}
	wait()
}
