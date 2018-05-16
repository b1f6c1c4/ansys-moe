.DEFAULT_GOAL: all

all:
	cd src && latexmk -pvc- -r ../.latexmkrc index.tex

%: src/%.tex
	cd src && latexmk -pvc -r ../.latexmkrc $*.tex & exit
