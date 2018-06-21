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
				common.SL("error", "Stringify log: "+err.Error())
				break
			}
			conn.Write(str)
		}
	}
}
