MK=latexmk -silent -use-make

.DEFAULT_GOAL: all

figures/dist/%.pdf: figures/%.xml
	-mkdir figures\dist
	drawio $< -o $@

figures/dist/%.png: figures/%.xml
	-mkdir figures\dist
	drawio $< -o $@

all: index.tex
	$(MK) -pvc- $< & exit

%: %.tex
	$(MK) -pvc $< & exit
