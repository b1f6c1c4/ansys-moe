package main

import (
	"ansysd"
	"fmt"
	"os"
	"os/signal"
)

func main() {
	ansysd.Entry(func(s string) {
		fmt.Println(s)
	})

	sg := make(chan os.Signal, 1)
	signal.Notify(sg, os.Interrupt)

	stop := make(chan struct{})
	go ansysd.Loop(stop)

	<-sg
	fmt.Println("Interrupted")
	close(stop)
}
