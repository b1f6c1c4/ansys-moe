library(methods);
library(optparse);
source("data/common.R");

option_list <- list(
  make_option(c("-i", "--input"), type="character", default=NULL,
              help="dataset file", metavar="character"),
	make_option(c("-o", "--output"), type="character", default=NULL,
              help="output file", metavar="character")
);

opt_parser <- OptionParser(option_list=option_list);
argv <- parse_args(opt_parser); # , positional_arguments=c(2, 2));

if (is.null(argv$input)) {
  print_help(opt_parser);
  stop("Need input file", call.=FALSE);
}

if (is.null(argv$output)) {
  print_help(opt_parser);
  stop("Need output file", call.=FALSE);
}

cfg <- unlist(strsplit(tools::file_path_sans_ext(basename(argv$output)), '-'));

if (length(cfg) != 3) {
  print_help(opt_parser);
  stop("Output file name format: [type]-[xdata]-[ydata].[ext]", call.=FALSE);
}

data <- getData(argv$input);

if (cfg[1] == "raw") {
  plotRaw(data, cfg[2], cfg[3]);
} else if (cfg[1] == "fea") {
  plotFea(data, cfg[2], cfg[3]);
} else {
  print_help(opt_parser);
  stop("Type must be 'raw' or 'fea'", call.=FALSE);
}
ggsave(argv$output, width=14.7, height=9.5, unit="cm");
