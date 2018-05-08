package commond

import (
	"commond/common"
	"encoding/json"
	"net"
	"time"
)

func getConn() (*net.UDPConn, error) {
	addr, err := net.ResolveUDPAddr("udp", common.C.LogUrl)
	if err != nil {
		return nil, err
	}

	conn, err := net.DialUDP("udp", nil, addr)
	if err != nil {
		return nil, err
	}

	return conn, nil
}

func publishLog(log chan *common.LogReport) {
	var conn *net.UDPConn
	for {
		c, err := getConn()
		if err == nil {
			conn = c
			break
		}
		select {
		case <-time.After(5 * time.Second):
		}
	}
	defer conn.Close()

	for {
		select {
		case lg := <-log:
			str, err := json.Marshal(lg)
			if err != nil {
				common.SL("Stringify log: " + err.Error())
				break
			}
			conn.Write(str)
		}
	}
}
