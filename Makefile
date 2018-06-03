MK=latexmk -silent -use-make

.DEFAULT_GOAL: all

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
