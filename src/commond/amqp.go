package commond

import (
	"commond/common"
	"encoding/json"
	"github.com/streadway/amqp"
	"time"
)

var mainCh, auxCh *amqp.Channel
var cancels map[string]*amqp.Queue

func setupAmqp(stop <-chan struct{}) error {
	hb, _ := time.ParseDuration("30s")
	conn, err := amqp.DialConfig(common.C.RabbitUrl, amqp.Config{
		Heartbeat: hb,
	})
	if err != nil {
		common.SL("Dial rabbit: " + err.Error())
		return err
	}

	mainCh, err = conn.Channel()
	if err != nil {
		common.SL("Open main channel: " + err.Error())
		return err
	}

	auxCh, err = conn.Channel()
	if err != nil {
		common.SL("Open aux channel: " + err.Error())
		return err
	}

	_, err = mainCh.QueueDeclare(
		"action", // name
		true,     // durable
		false,    // delete when unused
		false,    // exclusive
		false,    // no-wait
		nil,      // arguments
	)
	if err != nil {
		common.SL("Declare queue action: " + err.Error())
		return err
	}

	err = auxCh.ExchangeDeclare(
		"monitor", // name
		"topic",   // type
		false,     // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		common.SL("Declare exchange monitor: " + err.Error())
		return err
	}

	err = auxCh.ExchangeDeclare(
		"cancel", // name
		"topic",  // type
		true,     // durable
		false,    // delete when unused
		false,    // exclusive
		false,    // no-wait
		nil,      // arguments
	)
	if err != nil {
		common.SL("Declare exchange cancel: " + err.Error())
		return err
	}

	err = mainCh.Qos(
		common.C.Prefetch, // prefetch count
		0,                 // prefetch size
		false,             // global
	)
	if err != nil {
		common.SL("Set main channel qos: " + err.Error())
		return err
	}

	cancels = make(map[string]*amqp.Queue)

	go func() {
		select {
		case <-stop:
		}
		mainCh.Close()
		auxCh.Close()
		conn.Close()
	}()
	return nil
}

func subscribeCommand(kind string, cmd chan<- *common.RawCommand) {
	_, err := mainCh.QueueDeclare(
		kind,  // name
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		common.SL("Declare main queue: " + err.Error())
		return
	}

	msgs, err := mainCh.Consume(
		kind,  // queue
		"",    // consumer
		false, // auto-ack
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		common.SL("Consume main queue: " + err.Error())
		return
	}

	for d := range msgs {
		cmd <- &common.RawCommand{d.CorrelationId, kind, d.Body}
	}
}

func publishAction(act <-chan common.ExeContext) {
	for {
		select {
		case action := <-act:
			str, err := json.Marshal(action)
			if err != nil {
				common.RL.Error(action, "amqp", "Stringify action: "+err.Error())
				break
			}
			err = mainCh.Publish(
				"",       // exchange
				"action", // routing key
				false,    // mandatory
				false,    // immediate
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
	for {
		select {
		case st := <-stt:
			key := "status:" + st.Kind
			if st.CommandID != "" {
				key = key + ":" + st.CommandID
			}
			str, err := json.Marshal(st)
			if err != nil {
				common.RL.Error(st, "amqp", "Stringify status: "+err.Error())
				break
			}
			err = mainCh.Publish(
				"monitor", // exchange
				key,       // routing key
				false,     // mandatory
				false,     // immediate
				amqp.Publishing{
					ContentType: "application/json",
					Body:        str,
				},
			)
			if err != nil {
				common.SL("Publish status to main: " + err.Error())
				break
			}
		}
	}
}

func publishLog(log chan *common.LogReport) {
	for {
		select {
		case lg := <-log:
			key := "log:" + lg.Kind
			if lg.CommandID != "" {
				key = key + ":" + lg.CommandID
			}
			str, err := json.Marshal(lg)
			if err != nil {
				common.SL("Stringify log: " + err.Error())
				break
			}
			err = mainCh.Publish(
				"monitor", // exchange
				key,       // routing key
				false,     // mandatory
				false,     // immediate
				amqp.Publishing{
					ContentType: "application/json",
					Body:        str,
				},
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
	q, err := auxCh.QueueDeclare(
		"",    // name
		false, // durable
		true,  // delete when unused
		true,  // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		common.RL.Error(e, "amqp", "Declare temp queue: "+err.Error())
		return
	}
	err = auxCh.QueueBind(
		q.Name,   // queue name
		key,      // routing key
		"cancel", // exchange
		false,
		nil,
	)
	if err != nil {
		common.RL.Error(e, "amqp", "Queue bind: "+err.Error())
		return
	}
	cmsgs, err := auxCh.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	go func() {
		for range cmsgs {
			close(cll)
		}
	}()
	cancels[e.GetCommandID()] = &q
}

func unsubscribeCancel(e common.ExeContext) {
	q := cancels[e.GetCommandID()]
	if q == nil {
		return
	}
	_, err := auxCh.QueueDelete(q.Name, false, false, true)
	if err != nil {
		common.RL.Error(e, "amqp", "Delete queue: "+err.Error())
		return
	}
}
