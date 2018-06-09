MK=latexmk -silent -use-make

# [#1](https://github.com/linhr/thuappendixbib/issues/1#issuecomment-394139645)
all: index.tex
	-mkdir dist
	xelatex -interaction=batchmode -halt-on-error -recorder -output-directory="./dist" index.tex & exit
	-bibtex dist/index
	xelatex -interaction=batchmode -halt-on-error -recorder -output-directory="./dist" index.tex & exit
	xelatex -interaction=batchmode -halt-on-error -recorder -output-directory="./dist" index.tex & exit

data/dist/%.pdf: data/raw/ev-wpt-2bd37a50.csv data/common.R data/plot.R
	-mkdir data\dist
	Rscript --vanilla data/plot.R -i $< -o $@ & exit
	-del /Q Rplots.pdf

data/dist/opt.tex: data/raw/ev-wpt-2bd37a50.csv data/template.tex data/index.js
	-mkdir data\dist
	node data $< -o $@ & exit

figures/dist/%.pdf: figures/%.xml
	-mkdir figures\dist
	drawio $< -o $@ & exit

figures/dist/%.png: figures/%.xml
	-mkdir figures\dist
	drawio $< -o $@ & exit

%: %.tex
	$(MK) -pvc $< & exit
