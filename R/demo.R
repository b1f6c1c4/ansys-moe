source('R/ei.R')
library("CEoptim")

x <- seq(0, 1, 0.1)^2;
y <- (30 * (x-0.8)^3+5 * (x-0.5)^2+5)^2;
best <- min(y);
object <- GP_fit(x, y);

eifun <- ei(object, 2)
CEoptim(
        f=eifun,
        maximize=TRUE,
        continuous=list(
                        mean=c(0.27,0.22),
                        sd=c(0.1,0.1),
                        conMat=matrix(c(1,-1,0,0,0,0,1,-1),ncol=2),
                        conVec=c(1,0,1,0)
                        ),
        verbose=TRUE,
        );

# eifun <- ei(object, 3)
# CEoptim(
#         f=eifun,
#         maximize=TRUE,
#         continuous=list(
#                         mean=c(0.27,0.4),
#                         sd=c(1,1),
#                         conMat=matrix(c(1,-1,0,0,0,0,1,-1),ncol=2),
#                         conVec=c(1,0,1,0)
#                         ),
#         discrete=list(
#                       categories=as.integer(c(100))
#                       ),
#         verbose=TRUE,
#         );
