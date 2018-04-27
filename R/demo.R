source('R/ei.R')
library("CEoptim")

x <- seq(0, 1, 0.1)^2;
y <- (30 * (x-0.8)^3+5 * (x-0.5)^2+5)^2;
best <- min(y);
object <- GP_fit(x, y);

eifun <- ei(object, being=c(0.21));
CEoptim(
        f=eifun,
        maximize=TRUE,
        continuous=list(
                        mean=c(0.5),
                        sd=c(2),
                        conMat=matrix(c(1,-1),ncol=1),
                        conVec=c(1,0)
                        ),
        verbose=TRUE,
        );
