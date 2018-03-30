package commond

import (
    "github.com/streadway/amqp"
)

func runAmqp(
	queue string,
	cmd chan<- *RawCommand,
	ccl chan<- string,
	act <-chan *interface{},
	stt <-chan *StatusReport,
	log chan *LogReport,
	cancelControl chan<- CancelControl,
	stop <-chan struct{},
) {
    conn, err := amqp.Dial(globalConfig.RabbitUrl)
	if err != nil {
		staticLogger("Dial rabbit: " + err.Error())
		return
	}
	defer conn.Close()

	mainCh, err := conn.Channel()
	defer mainCh.Close()
	if err != nil {
		staticLogger("Open main channel: " + err.Error())
		return
	}

	auxCh, err := conn.Channel()
	defer mainCh.Close()
	if err != nil {
		staticLogger("Open aux channel: " + err.Error())
		return
	}

	qMain, err := mainCh.QueueDeclare(
        queue, // name
        true,        // durable
        false,       // delete when unused
        false,       // exclusive
        false,       // no-wait
        nil,         // arguments
	)
	if err != nil {
		staticLogger("Declare main queue: " + err.Error())
		return
	}

	qAction, err := mainCh.QueueDeclare(
        "action", // name
        true,        // durable
        false,       // delete when unused
        false,       // exclusive
        false,       // no-wait
        nil,         // arguments
	)
	if err != nil {
		staticLogger("Declare queue action: " + err.Error())
		return
	}

	err := aux.ExchangeDeclare(
        "monitor", // name
		"topic", // type
        false,        // durable
        false,       // delete when unused
        false,       // exclusive
        false,       // no-wait
        nil,         // arguments
	)
	if err != nil {
		staticLogger("Declare exchange monitor: " + err.Error())
		return
	}

	err := auxCh.ExchangeDeclare(
        "cancel", // name
		"topic", // type
        true,        // durable
        false,       // delete when unused
        false,       // exclusive
        false,       // no-wait
        nil,         // arguments
	)
	if err != nil {
		staticLogger("Declare exchange cancel: " + err.Error())
		return
	}

	err = mainCh.Qos(
        globalConfig.Prefetch,     // prefetch count
        0,     // prefetch size
        false, // global
	)
	if err != nil {
		staticLogger("Set main channel qos: " + err.Error())
		return
	}

	msgs, err := mainCh.Consume(
        queue, // queue
        "",     // consumer
        false,  // auto-ack
        false,  // exclusive
        false,  // no-local
        false,  // no-wait
        nil,    // args
	)
	if err != nil {
		staticLogger("Consume main queue: " + err.Error())
		return
	}

	cancels := make(map[string] *amqp.Queue)

	go func() {
		for d := range msgs {
			cmd <- &RawCommand{d.CorrelationId,d.Body}
		}
	}()
	for {
		select {
		case action := <-act:
			str, err := json.Marshal(action)
			if err != nil {
				log <- &LogReport(action.cId, "error", "amqp", "Stringify action: " + err.Error())
				break
			}
			err = mainCh.Publish(
                "",        // exchange
                "action", // routing key
                false,     // mandatory
                false,     // immediate
                amqp.Publishing{
					ContentType: "application/json",
                    Body: str,
                },
			)
			if err != nil {
				staticLogger("Publish action to main: " + err.Error())
				break
			}
		case st := <-stt:
			key := "status:" + queue
			if lg.cId != "" {
				key = key + ":" + lg.cId
			}
			str, err := json.Marshal(st)
			if err != nil {
				log <- &LogReport(action.cId, "error", "amqp", "Stringify status: " + err.Error())
				break
			}
			err = mainCh.Publish(
                "monitor",        // exchange
				key, // routing key
                false,     // mandatory
                false,     // immediate
                amqp.Publishing{
					ContentType: "application/json",
                    Body: str,
                },
			)
			if err != nil {
				staticLogger("Publish status to main: " + err.Error())
				break
			}
		case lg := <-log:
			key := "log:" + queue
			if lg.cId != "" {
				key = key + ":" + lg.cId
			}
			str, err := json.Marshal(lg)
			if err != nil {
				staticLogger("Stringify log: " + err.Error())
				break
			}
			err = mainCh.Publish(
                "monitor",        // exchange
				key, // routing key
                false,     // mandatory
                false,     // immediate
                amqp.Publishing{
					ContentType: "application/json",
                    Body: str,
                },
			)
			if err != nil {
				staticLogger(string(str))
				staticLogger("Publish log to main: " + err.Error())
				break
			}
		case cctrl := <-cancelControl:
			if cctrl.Enable {
				key := "log:" + queue + ":" + cctrl.cId
				q, err := auxCh.QueueDeclare(
					"", // name
					false,        // durable
					true,       // delete when unused
					true,       // exclusive
					false,       // no-wait
					nil,         // arguments
				)
				if err != nil {
					log <- &LogReport(cctrl.cId, "error", "amqp", "Declare temp queue: " + err.Error())
					break
				}
				err = auxCh.QueueBind(
					q.Name,       // queue name
					key,            // routing key
					"cancel", // exchange
					false,
					nil,
				)
				if err != nil {
					log <- &LogReport(cctrl.cId, "error", "amqp", "Queue bind: " + err.Error())
					break
				}
				cmsgs, err := auxCh.Consume(
					q.Name, // queue
					"",     // consumer
					true,  // auto-ack
					false,  // exclusive
					false,  // no-local
					false,  // no-wait
					nil,    // args
				)
				go func() {
					for range cmsgs {
						ccl <- cctrl.cId
					}
				}()
				cancels[cctrl.cId] = q
			} else {
				q := cancels[cctrl.cId]
				if q != nil {
					_, err := auxCh.QueueDelete(q.Name, false, false, true)
					if err != nil {
						log <- &LogReport(cctrl.cId, "error", "amqp", "Delete queue: " + err.Error())
						break
					}
				}
			}
		case <-stop:
			return
		}
	}
}
