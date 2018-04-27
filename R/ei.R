library("GPfit")
library("lhs")
library("randtoolbox")

ei <- function(object, num_quasi=1000, being=c()) {
    X <- object$X;
    Y <- object$Y;
    best <- min(Y);
    n <- nrow(X);
    d <- ncol(X);
    corr <- object$correlation_param;
    power <- corr$power;

    if (!is.null(being)) {
        being <- matrix(being, ncol=d);
        P <- nrow(being);
    } else {
        P <- 0;
    }
    Q <- P + 1;

    beta <- object$beta;
    sig2 <- object$sig2;
    delta <- object$delta;
    nu <- corr$nu;
    if (is.null(nu)){
        nu <- 2.5;
    }

    dim(beta) <- c(d, 1);
    R <- corr_matrix(X, beta, corr);

    One <- rep(1, n);
    LO <- diag(n);
    Sig <- R + delta * LO;
    L <- chol(Sig);

    SigIY <- solve(Sig, Y);

    if (corr$type == "exponential") {
        rfun <- function(del) exp(-(abs(del)^power) %*% (10^beta));
    } else if (corr$type == "matern") {
        rfun <- function(del) {
            junk <- 2 * sqrt(nu) * abs(del) * (10^t(beta))
            ID <- which(junk == 0)
            tmp <- 1/(gamma(nu) * 2^(nu-1)) * (junk)^nu * besselK(junk, nu)
            tmp[ID] <- 1;
            return(prod(tmp));
        }
    }

    Ks <- matrix(0, n, Q);
    Kss <- matrix(0, Q, Q);
    if (P > 0) {
        for(jj in 1:P) {
            for(kk in 1:n) {
                Ks[kk, jj] <- rfun(X[kk, ] - being[jj, ]);
            }
            for(kk in 1:P) {
                if (kk == jj) {
                    Kss[kk, jj] <- 1;
                } else if (kk > jj) {
                    Kss[kk, jj] <- rfun(being[kk, ] - being[jj, ]);
                } else {
                    Kss[kk, jj] <- Kss[jj, kk];
                }
            }
        }
    }
    Kss[Q, Q] <- 1;
    quasi <- matrix(qnorm(sobol(num_quasi, Q), 0, 1), ncol=Q);
    quasifun <- function(xnew) {
        for(kk in 1:n) {
            Ks[kk, Q] <- rfun(X[kk, ] - xnew);
        }
        if (P > 0) {
            for(kk in 1:P) {
                Kss[kk, Q] <- rfun(being[kk, ] - xnew);
                Kss[Q, kk] <- Kss[kk, Q];
            }
        }
        mus <- t(Ks) %*% SigIY;
        V <- solve(t(L), Ks);
        Sigs <- Kss - t(V) %*% V;
        Ls <- chol(Sigs, pivot=TRUE);
        musx <- matrix(mus, ncol=Q, nrow=num_quasi, byrow=TRUE);
        return(musx + sqrt(sig2) * (quasi %*% Ls));
    }

    eifun <- function(xnew) {
        q <- quasifun(xnew);
        ei <- mean(pmax(apply(best - q, 1, max), 0));
        return(ei);
    }

    return(eifun);
}
