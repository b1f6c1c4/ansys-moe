package commond

import (
	"commond/common"
	"encoding/json"
	"github.com/assembla/cony"
	"github.com/streadway/amqp"
	"regexp"
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
		prev := ""
		ticker := time.NewTicker(20 * time.Second)
		for cli.Loop() {
			select {
			case <-ticker.C:
				prev = ""
			case err := <-cli.Errors():
				if err.Error() == prev {
					break
				}
				common.RL.Error(common.Core, "amqp", "Amqp client: "+err.Error())
				prev = err.Error()
			case <-stop:
				cli.Close()
			}
		}
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
