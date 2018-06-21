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
	"commond/common"
	"encoding/json"
	"errors"
	"github.com/assembla/cony"
	"github.com/streadway/amqp"
	"regexp"
	"strconv"
	"time"
)

var cli *cony.Client
var actionQ *cony.Queue
var cancelE *cony.Exchange
var cancels map[string]func()

func setupAmqp(stop <-chan struct{}) error {
	hb := 5 * time.Second
	cli = cony.NewClient(
		cony.URL(common.C.RabbitUrl),
		cony.Config(amqp.Config{
			Properties: amqp.Table{
				"product":  "commond",
				"platform": "golang",
				"version":  VERSION,
			},
			Heartbeat: hb,
		}),
	)

	actionQ = &cony.Queue{
		Name:       "action",
		Durable:    true,
		AutoDelete: false,
		Exclusive:  false,
	}

	cancelE = &cony.Exchange{
		Name:       "cancel",
		Kind:       "topic",
		Durable:    false,
		AutoDelete: false,
	}

	cli.Declare([]cony.Declaration{
		cony.DeclareQueue(actionQ),
		cony.DeclareExchange(*cancelE),
	})

	cancels = make(map[string]func())

	go func() {
		count := 0
		prev := ""
		ticker := time.NewTicker(20 * time.Second)
		for cli.Loop() {
			select {
			case <-ticker.C:
				if count >= 100 {
					common.RL.Fatal(common.Core, "amqp", "Too many errors ("+strconv.Itoa(count)+"), die")
					<-time.After(2 * time.Second)
					panic(errors.New("Too many errors"))
				}
				count = 0
				prev = ""
			case err := <-cli.Errors():
				count++
				if count >= 20000 {
					common.RL.Fatal(common.Core, "amqp", "Too many errors ("+strconv.Itoa(count)+"), die")
					<-time.After(2 * time.Second)
					panic(errors.New("Too many errors"))
				}
				if err.Error() == prev {
					break
				}
				common.RL.Error(common.Core, "amqp", "Amqp client: "+err.Error())
				prev = err.Error()
			case <-stop:
				cli.Close()
			}
		}
		common.RL.Warn(common.Core, "amqp", "Normal exit")
	}()
	return nil
}

func subscribeCommand(kind string, pref int, cmd chan<- *common.RawCommand) error {
	qCommand := &cony.Queue{
		Name:       kind,
		Durable:    true,
		AutoDelete: false,
		Exclusive:  false,
	}
	qCancel := &cony.Queue{
		Name:       "",
		Durable:    false,
		AutoDelete: true,
		Exclusive:  true,
	}
	bnd := &cony.Binding{
		Queue:    qCancel,
		Exchange: *cancelE,
		Key:      "cancel." + kind + ".#",
	}
	cli.Declare([]cony.Declaration{
		cony.DeclareQueue(qCommand),
		cony.DeclareQueue(qCancel),
		cony.DeclareBinding(*bnd),
	})

	cCommand := cony.NewConsumer(qCommand, cony.Qos(pref))
	cCancel := cony.NewConsumer(qCancel, cony.AutoAck())

	cli.Consume(cCommand)
	cli.Consume(cCancel)

	reg := regexp.MustCompile(`^cancel\.` + kind + `\.(.*)$`)

	go func() {
		for cli.Loop() {
			select {
			case d := <-cCommand.Deliveries():
				ack := func() {
					d.Ack(false)
				}
				var cfg string
				if d.Headers["cfg"] != nil {
					cfg = d.Headers["cfg"].(string)
				}
				cmd <- &common.RawCommand{
					d.CorrelationId,
					kind,
					cfg,
					d.Body,
					ack,
				}
			case d := <-cCancel.Deliveries():
				match := reg.FindStringSubmatch(d.RoutingKey)
				if len(match) >= 2 {
					fn, ok := cancels[match[1]]
					if ok {
						fn()
						delete(cancels, match[1])
					}
				}
			case err := <-cCommand.Errors():
				common.RL.Error(common.Core, "amqp", "Command consumer of kind "+kind+": "+err.Error())
			case err := <-cCancel.Errors():
				common.RL.Error(common.Core, "amqp", "Cancel consumer of kind "+kind+": "+err.Error())
			}
		}
	}()

	return nil
}

func publishAction(act <-chan common.ExeContext) {
	pbl := cony.NewPublisher("", "action")
	cli.Publish(pbl)
	for {
		select {
		case action := <-act:
			str, err := json.Marshal(action)
			if err != nil {
				common.RL.Error(action, "amqp", "Stringify action: "+err.Error())
				break
			}
			err = pbl.Publish(
				amqp.Publishing{
					Headers: map[string]interface{}{
						"kind": action.GetKind(),
						"cfg":  action.GetCfg(),
					},
					CorrelationId: action.GetCommandID(),
					ContentType:   "application/json",
					Body:          str,
				},
			)
			if err != nil {
				common.RL.Error(common.Core, "amqp", "Publish action to main: "+err.Error())
				break
			}
		}
	}
}

func subscribeCancel(e common.ExeContext, cll chan struct{}) {
	cancels[e.GetCommandID()] = func() {
		common.RL.Notice(common.Core, "amqp", "Received cancel of kind "+e.GetKind())
		close(cll)
	}
}

func unsubscribeCancel(e common.ExeContext) {
	delete(cancels, e.GetCommandID())
}
