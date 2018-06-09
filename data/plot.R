library(methods);
library(optparse);
library(rPref);
library(ggplot2);

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

raw <- read.csv(argv$input);
colnames(raw)[1] <- "dCoilTurns";
colnames(raw)[28] <- "P0";
raw$P0[is.na(raw$P0)] <- 0;
raw$dCoilTurns <- as.factor(raw$dCoilTurns);

fea <- raw[raw$P0 < 0, ];
fea <- fea[order(fea$P0), ];
fea <- fea[fea$pDimension <= 0.5, ];
fea <- fea[fea$pThickness <= 0.03, ];
fea <- fea[fea$eIndMutNormal >= 24*0.9, ];
fea <- fea[fea$eIndMutNormal <= 24*1.1, ];
fea <- fea[fea$eIndMutMisaligned >= 10, ];
fea <- fea[fea$eNormalK >= 0.1, ];

opt <- psel(fea,
  high(pDimensionPenalty) *
  high(pThicknessPenalty) *
  high(pNormalIndMutPenalty) *
  high(pMisalignedIndMutPenalty) *
  high(pNormalKPenalty)
);

plotRaw <- function(x, y) {
  ggplot(raw, aes_string(x=x, y=y)) +
  geom_point(shape=4) +
  geom_point(data=fea, shape=3, size=3) +
  facet_wrap(~dCoilTurns) +
  theme_bw() +
  theme(axis.text=element_text(size=12),
        axis.title=element_text(size=14,face="bold"))
};

plotFea <- function(x, y) {
  ggplot(fea, aes_string(x=x, y=y)) +
  geom_point(shape=3, size=2) +
  geom_point(data=opt, size=2) +
  facet_wrap(~dCoilTurns) +
  theme_bw() +
  theme(axis.text=element_text(size=12),
        axis.title=element_text(size=14,face="bold"))
};

cfg <- unlist(strsplit(tools::file_path_sans_ext(basename(argv$output)), '-'));

if (length(cfg) != 3) {
  print_help(opt_parser);
  stop("Output file name format: [type]-[xdata]-[ydata].[ext]", call.=FALSE);
}

if (cfg[1] == "raw") {
  plotRaw(cfg[2], cfg[3]);
} else if (cfg[1] == "fea") {
  plotFea(cfg[2], cfg[3]);
} else {
  print_help(opt_parser);
  stop("Type must be 'raw' or 'fea'", call.=FALSE);
}
ggsave(argv$output);
