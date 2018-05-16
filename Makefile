.DEFAULT_GOAL: all

all:
	cd src && latexmk -pvc- -r ../.latexmkrc index.tex & exit

%: src/%.tex
	cd src && latexmk -pvc -r ../.latexmkrc $*.tex & exit
