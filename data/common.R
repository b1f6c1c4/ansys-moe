library(rPref);
library(ggplot2);

getData <- function(filename) {
  raw <- read.csv(filename);
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
    # high(pThicknessPenalty) *
    # high(pNormalIndMutPenalty) *
    high(pMisalignedIndMutPenalty) # *
    # high(pNormalKPenalty)
  );

  data <- list(
    raw=raw,
    fea=fea,
    opt=opt
  );
  return(data);
}

plotRaw <- function(data, x, y) {
  raw <- data$raw;
  raw <- raw[setdiff(rownames(raw), rownames(data$fea)), ];
  ggplot(raw, aes_string(x=x, y=y)) +
  geom_point(shape=4) +
  geom_point(data=data$fea, shape=3, size=2) +
  facet_wrap(~dCoilTurns) +
  theme_bw() +
  theme(axis.text=element_text(size=10),
        axis.title=element_text(size=10,face="bold"))
};

plotFea <- function(data, x, y) {
  ggplot(data$fea, aes_string(x=x, y=y)) +
  geom_point(shape=3, size=2) +
  geom_point(data=data$opt, size=2) +
  facet_wrap(~dCoilTurns) +
  theme_bw() +
  theme(axis.text=element_text(size=10),
        axis.title=element_text(size=10,face="bold"))
};

plotOpt <- function(data, x, y, z) {
  ggplot(data$fea, aes_string(x=x, y=y, size=z)) +
  geom_point(shape=1) +
  facet_wrap(~dCoilTurns) +
  theme_bw() +
  theme(axis.text=element_text(size=10),
        axis.title=element_text(size=10,face="bold"))
};
