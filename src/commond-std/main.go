package main

import (
	"commond"
	"fmt"
	"os"
	"os/signal"
)

func main() {
	commond.Entry(func(s string) {
		fmt.Println(s)
	})

	sg := make(chan os.Signal, 1)
	signal.Notify(sg, os.Interrupt)

	stop := make(chan struct{})
	go commond.Loop(stop)

	<-sg
	fmt.Println("Interrupted")
	close(stop)
}
