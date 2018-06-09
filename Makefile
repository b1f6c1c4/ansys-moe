MK=latexmk -silent -use-make

.DEFAULT_GOAL: all

data/dist/%.pdf: data/raw/ev-wpt-2bd37a50.csv data/common.R data/plot.R
	-mkdir data\dist
	Rscript --vanilla data/plot.R -i $< -o $@
	-del /Q Rplots.pdf

data/dist/opt.tex: data/raw/ev-wpt-2bd37a50.csv data/template.tex data/index.js
	-mkdir data\dist
	node data $< -o $@

figures/dist/%.pdf: figures/%.xml
	-mkdir figures\dist
	drawio $< -o $@

figures/dist/%.png: figures/%.xml
	-mkdir figures\dist
	drawio $< -o $@

%: %.tex
	$(MK) -pvc $< & exit

# [#1](https://github.com/linhr/thuappendixbib/issues/1#issuecomment-394139645)
all: index.tex
	-mkdir dist
	xelatex -interaction=batchmode -halt-on-error -recorder -output-directory="./dist" index.tex
	-bibtex dist/index
	xelatex -interaction=batchmode -halt-on-error -recorder -output-directory="./dist" index.tex
	xelatex -interaction=batchmode -halt-on-error -recorder -output-directory="./dist" index.tex
