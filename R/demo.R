source('R/bgo.R')

x <- seq(0, 1, 0.1)^2;
y <- (30 * (x-0.8)^3+5 * (x-0.5)^2+5)^2;
best <- min(y);
object <- GP_fit(x, y);

bgo(object, 4, being=c(0.21))
