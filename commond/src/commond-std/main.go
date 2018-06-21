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
package main

import (
	"commond"
	"fmt"
	"os"
	"os/signal"
)

func main() {
	commond.Entry(func(l, s string) {
		fmt.Println(s)
	})

	sg := make(chan os.Signal, 1)
	signal.Notify(sg, os.Interrupt)

	stop := make(chan struct{})
	go func() {
		<-sg
		close(stop)
	}()

	commond.Loop(stop)
}
