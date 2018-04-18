package commond

import (
	"commond/common"
	"encoding/json"
	"github.com/assembla/cony"
	"github.com/streadway/amqp"
	"time"
)

var cli *cony.Client
var actionQ *cony.Queue
var monitorE, cancelE *cony.Exchange
var cancels map[string]func()

func setupAmqp(stop <-chan struct{}) error {
	hb := 5 * time.Second
	cli = cony.NewClient(
		cony.URL(common.C.RabbitUrl),
		cony.Config(amqp.Config{Heartbeat: hb}),
	)

	actionQ = &cony.Queue{
		Name:       "action",
		Durable:    true,
		AutoDelete: false,
		Exclusive:  false,
	}

	monitorE = &cony.Exchange{
		Name:       "monitor",
		Kind:       "topic",
		Durable:    false,
		AutoDelete: false,
	}

	cancelE = &cony.Exchange{
		Name:       "cancel",
		Kind:       "topic",
		Durable:    false,
		AutoDelete: false,
	}

	cli.Declare([]cony.Declaration{
		cony.DeclareQueue(actionQ),
		cony.DeclareExchange(*monitorE),
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
				common.SL("Amqp client: " + err.Error())
				prev = err.Error()
			case <-stop:
				cli.Close()
			}
		}
	}()
	return nil
}

func subscribeCommand(kind string, pref int, cmd chan<- *common.RawCommand) error {
	queue := &cony.Queue{
		Name:       kind,
		Durable:    true,
		AutoDelete: false,
		Exclusive:  false,
	}
	cli.Declare([]cony.Declaration{
		cony.DeclareQueue(queue),
	})

	cns := cony.NewConsumer(queue, cony.Qos(pref))

	cli.Consume(cns)

	go func() {
		for cli.Loop() {
			select {
			case d := <-cns.Deliveries():
				ack := func() {
					d.Ack(false)
				}
				cmd <- &common.RawCommand{d.CorrelationId, kind, d.Body, ack}
			case err := <-cns.Errors():
				common.SL("Consumer of kind " + kind + ": " + err.Error())
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
					},
					CorrelationId: action.GetCommandID(),
					ContentType:   "application/json",
					Body:          str,
				},
			)
			if err != nil {
				common.SL("Publish action to main: " + err.Error())
				break
			}
		}
	}
}

func publishStatus(stt <-chan *common.StatusReport) {
	pbl := cony.NewPublisher("monitor", "")
	cli.Publish(pbl)
	for {
		select {
		case st := <-stt:
			key := "status." + st.Kind
			if st.CommandID != "" {
				key = key + "." + st.CommandID
			}
			str, err := json.Marshal(st)
			if err != nil {
				common.RL.Error(st, "amqp", "Stringify status: "+err.Error())
				break
			}
			err = pbl.PublishWithRoutingKey(
				amqp.Publishing{
					Headers: map[string]interface{}{
						"host": common.HostName,
					},
					ContentType: "application/json",
					Body:        str,
				},
				key,
			)
			if err != nil {
				common.SL("Publish status to main: " + err.Error())
				break
			}
		}
	}
}

func publishLog(log chan *common.LogReport) {
	pbl := cony.NewPublisher("monitor", "")
	cli.Publish(pbl)
	for {
		select {
		case lg := <-log:
			key := "log." + lg.Kind
			if lg.CommandID != "" {
				key = key + "." + lg.CommandID
			}
			str, err := json.Marshal(lg)
			if err != nil {
				common.SL("Stringify log: " + err.Error())
				break
			}
			err = pbl.PublishWithRoutingKey(
				amqp.Publishing{
					Headers: map[string]interface{}{
						"host": common.HostName,
					},
					ContentType: "application/json",
					Body:        str,
				},
				key,
			)
			if err != nil {
				common.SL(string(str))
				common.SL("Publish log to main: " + err.Error())
				break
			}
		}
	}
}

func subscribeCancel(e common.ExeContext, cll chan struct{}) {
	key := "log:" + e.GetKind() + ":" + e.GetCommandID()
	queue := &cony.Queue{
		Name:       "",
		Durable:    false,
		AutoDelete: true,
		Exclusive:  true,
	}
	bnd := &cony.Binding{
		Queue:    queue,
		Exchange: *cancelE,
		Key:      key,
	}
	cli.Declare([]cony.Declaration{
		cony.DeclareQueue(queue),
		cony.DeclareBinding(*bnd),
	})
	cns := cony.NewConsumer(queue, cony.AutoAck())
	cli.Consume(cns)
	go func() {
		for cli.Loop() {
			select {
			case _, ok := <-cns.Deliveries():
				if !ok {
					// Unsubscribed, don't close the same channel twice
					return
				}
				close(cll)
			case err := <-cns.Errors():
				common.SL("Consumer of cancel: " + err.Error())
			}
		}
	}()
	cancels[e.GetCommandID()] = func() {
		cns.Cancel()
	}
}

func unsubscribeCancel(e common.ExeContext) {
	f := cancels[e.GetCommandID()]
	if f == nil {
		return
	}
	f()
	cancels[e.GetCommandID()] = nil
}
