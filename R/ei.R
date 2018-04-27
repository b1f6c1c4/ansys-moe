library("GPfit")
library("lhs")
library("randtoolbox")
library("CEoptim")

ei <- function(object, num_quasi = 1000, being = NULL) {
    X <- object$X;
    Y <- object$Y;
    best <- min(Y);
    n <- nrow(X);
    d <- ncol(X);
    corr <- object$correlation_param;
    power <- corr$power;

    if (!is.null(being)) {
        being <- matrix(being, ncol = d);
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
    R <- GPfit::corr_matrix(X, beta, corr);

    LO <- diag(n);
    Sig <- R + delta * LO;
    L <- chol(Sig);

    temporal_y <- solve(Sig, Y);

    if (corr$type == "exponential") {
        rfun <- function(del) exp(- (abs(del) ^ power) %*% (10 ^ beta));
    } else if (corr$type == "matern") {
        rfun <- function(del) {
            t <- 2 * sqrt(nu) * abs(del) * (10 ^ t(beta))
            ID <- which(t == 0)
            tmp <- 1 / (gamma(nu) * 2 ^ (nu - 1)) * t ^ nu * besselK(t, nu)
            tmp[ID] <- 1;
            return(prod(tmp));
        }
    }

    Ks <- matrix(0, n, Q);
    Kss <- matrix(0, Q, Q);
    if (P > 0) {
        for (jj in 1:P) {
            for (kk in 1:n) {
                Ks[kk, jj] <- rfun(X[kk, ] - being[jj, ]);
            }
            for (kk in 1:P) {
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
    quasi <- matrix(qnorm(randtoolbox::sobol(num_quasi, Q), 0, 1), ncol = Q);
    quasifun <- function(xnew) {
        for (kk in 1:n) {
            Ks[kk, Q] <- rfun(X[kk, ] - xnew);
        }
        if (P > 0) {
            for (kk in 1:P) {
                Kss[kk, Q] <- rfun(being[kk, ] - xnew);
                Kss[Q, kk] <- Kss[kk, Q];
            }
        }
        mus <- t(Ks) %*% temporal_y;
        V <- solve(t(L), Ks);
        Sigs <- Kss - t(V) %*% V;
        Ls <- chol(Sigs, pivot = TRUE);
        musx <- matrix(mus, ncol = Q, nrow = num_quasi, byrow = TRUE);
        return(musx + sqrt(sig2) * ( quasi %*% Ls ));
    }

    eifun <- function(xnew) {
        q <- quasifun(xnew);
        ei <- mean(pmax(apply(best - q, 1, max), 0));
        return(ei);
    }

    return(eifun);
}

eiopt <- function(rngs, sampled, values, being_sampled, num_quasi = 1000) {
    cats <- as.integer(rngs);
    object <- GPfit::GP_fit(sampled, values);
    eifun <- ei(object, num_quasi = num_quasi, being = being_sampled);
    rst <- CEoptim(
                   f = function(disc) eifun(disc / (rngs - 1)),
                   maximize = TRUE,
                   discrete = list(categories = cats, smoothProb = 0.1),
                   verbose = TRUE,
                   );
    print(rst);
    return(rst$optimizer$discrete / (rngs - 1));
}
