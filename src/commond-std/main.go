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
