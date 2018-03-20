package main

import (
	"ansysd"
	"fmt"
)

func main() {
	ansysd.Entry(func(s string) {
		fmt.Println(s)
	})
}
