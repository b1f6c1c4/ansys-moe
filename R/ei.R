library("GPfit")
library("lhs")
library("randtoolbox")

ei <- function(object, Q, num_quasi=1000, being=c()) {
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

    done <- FALSE;
    Ks <- matrix(0, n, Q);
    Kss <- matrix(0, Q, Q);
    quasi <- matrix(qnorm(sobol(num_quasi, Q), 0, 1), ncol=Q);
    quasifun <- function(xnew) {
        xnew <- matrix(xnew, ncol=d);
        if (!is.null(being)) {
            xnew <- rbind(being, xnew);
        }
        for(jj in 1:Q) {
            if (done && jj <= P) {
                continue;
            }
            for(kk in 1:n) {
                Ks[kk, jj] <- rfun(X[kk, ] - xnew[jj, ]);
            }
            for(kk in 1:Q) {
                if (kk == jj) {
                    Kss[kk, jj] <- 1;
                } else if (kk > jj) {
                    Kss[kk, jj] <- rfun(xnew[kk, ] - xnew[jj, ]);
                } else {
                    Kss[kk, jj] <- Kss[jj, kk];
                }
            }
        }
        done <- TRUE;
        mus <- t(Ks) %*% SigIY;
        V <- solve(t(L), Ks);
        Sigs <- Kss - t(V) %*% V;
        Ls <- chol(Sigs, pivot=TRUE);
        musx <- matrix(mus, ncol=Q, nrow=num_quasi, byrow=TRUE);
        return(musx + sqrt(sig2) * (quasi %*% Ls));
    }

    eifun <- function(cont, disc) {
        # q <- quasifun(cbind(cont, disc/100));
        q <- quasifun(cont);
        ei <- mean(pmax(apply(best - q, 1, max), 0));
        return(ei);
    }

    return(eifun);
}
