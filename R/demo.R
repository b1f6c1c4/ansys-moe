sink(stderr())

source("R/ei.R")
library("CEoptim")
library("jsonlite")

x <- seq(0, 1, 0.1)^2;
y <- (30 * (x-0.8)^3+5 * (x-0.5)^2+5)^2;
object <- GP_fit(x, y);

cats <- c(21474364);

eifun <- ei(object, being=c(0.21));
f <- function(disc) {
    return(eifun(disc / cats));
};
rst <- CEoptim(
        f=f,
        maximize=TRUE,
        discrete=list(
                      categories=as.integer(cats)
                      ),
        verbose=TRUE,
        );

print(rst)
sink()
print(toJSON(rst$optimizer$discrete))
