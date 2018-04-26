#include "moe.h"

#include <algorithm>

#include <gpp_common.hpp>
#include <gpp_covariance.hpp>
#include <gpp_domain.hpp>
#include <gpp_logging.hpp>
#include <gpp_math.hpp>
#include <gpp_model_selection.hpp>
#include <gpp_optimization.hpp>
#include <gpp_optimizer_parameters.hpp>
#include <gpp_random.hpp>
#include <gpp_test_utils.hpp>

using namespace optimal_learning;

json Moe::Execute(const json &command) {
    using DomainType = TensorProductDomain;
    using HyperparameterDomainType = TensorProductDomain;
    auto dim = command.at("D").size();
    auto num_to_sample = command.at("q").get<size_t>();
    auto num_being_sampled = command.at("current").size();
    auto num_sampled = command.at("done").size();
    size_t max_num_threads = 1;
    ThreadSchedule thread_schedule(max_num_threads, omp_sched_dynamic);

    // set up RNG containers
    int64_t pi_array[] = {314, 3141, 31415, 314159, 3141592, 31415926, 314159265, 3141592653, 31415926535, 314159265359};  // arbitrarily used digits of pi as seeds
    std::vector<NormalRNG> normal_rng_vec(max_num_threads);
    for (size_t i = 0; i < max_num_threads; ++i) {
        normal_rng_vec[i].SetExplicitSeed(pi_array[i]);  // to get repeatable results
        // call SetRandomizedSeed(base_seed, thread_id) to automatically choose 'random' seeds
    }
    UniformRandomGenerator uniform_generator(pi_array[0]);  // repeatable results
    // construct with (base_seed, thread_id) to generate a 'random' seed

    std::vector<ClosedInterval> domain_bounds;
    domain_bounds.reserve(dim);
    for (auto &&dpar : command.at("D")) {
        domain_bounds.emplace_back(
                dpar.at("lowerBound").get<double>(),
                dpar.at("upperBound").get<double>()
                );
    }
    DomainType domain(domain_bounds.data(), dim);

    std::vector<double> points_being_sampled(num_being_sampled*dim);
    auto ptr = points_being_sampled.data();
    for (auto &&obj : command.at("current")) {
        for (auto &&v : obj.at("D")) {
            *ptr++ = v.get<double>();
        }
    }

    std::vector<double> points_sampled(num_sampled*dim);
    std::vector<double> points_sampled_value(num_sampled);
    std::vector<double> noise_variance(num_sampled, 0.0);
    auto ptr1 = points_sampled.data();
    auto ptr2 = points_sampled_value.data();
    for (auto &&obj : command.at("done")) {
        for (auto &&v : obj.at("D")) {
            *ptr1++ = v.get<double>();
        }
        *ptr2++ = obj.at("P0").get<double>();
    }

    using CovarianceClass = SquareExponential;

    std::vector<double> hyperparameters_original(1 + dim);
    boost::uniform_real<double> uniform_double_for_hyperparameter(0.5, 1.5);
    CovarianceClass covariance_original(dim, 1.0, 1.0);
    auto nHyps = covariance_original.GetNumberOfHyperparameters();
    FillRandomCovarianceHyperparameters(
            uniform_double_for_hyperparameter,
            &uniform_generator,
            &hyperparameters_original,
            &covariance_original
            );

    std::vector<double> hyperparameters_perturbed(nHyps);
    boost::uniform_real<double> uniform_double_for_perturbed_hyperparameter(4.0, 8.0);
    CovarianceClass covariance_perturbed(dim, 1.0, 1.0);
    FillRandomCovarianceHyperparameters(
            uniform_double_for_perturbed_hyperparameter,
            &uniform_generator,
            &hyperparameters_perturbed,
            &covariance_perturbed
            );

    std::vector<ClosedInterval> hyperparameter_domain_bounds(nHyps, {1.0e-10, 1.0e10});
    HyperparameterDomainType hyperparameter_domain(hyperparameter_domain_bounds.data(), nHyps);

    using LogLikelihoodEvaluator = LogMarginalLikelihoodEvaluator;
    LogLikelihoodEvaluator log_marginal_eval(
            points_sampled.data(),
            points_sampled_value.data(),
            noise_variance.data(),
            dim,
            num_sampled
            );

    size_t total_newton_errors = 0;
    size_t newton_max_num_steps = 500;
    double gamma_newton = 1.05;
    double pre_mult_newton = 1.0e-1;
    double max_relative_change_newton = 1.0;
    double tolerance_newton = 1.0e-11;
    NewtonParameters newton_parameters(1, newton_max_num_steps, gamma_newton, pre_mult_newton, max_relative_change_newton, tolerance_newton);

    std::vector<double> new_newton_hyperparameters(nHyps);

    logger->info("Original Hyperparameters: {}", hyperparameters_original);

    total_newton_errors += NewtonHyperparameterOptimization(
            log_marginal_eval,
            covariance_perturbed,
            newton_parameters,
            hyperparameter_domain,
            new_newton_hyperparameters.data()
            );

    logger->info("Result of Newton: {}", new_newton_hyperparameters);

    if (total_newton_errors > 0) {
        logger->warn("{} Newton runs exited due to singular Hessian matrices", total_newton_errors);
    }

    /* // Now optimize EI using the 'best' hyperparameters */
    /* // set gaussian process's hyperparameters to the result of newton optimization */
    /* CovarianceClass covariance_opt(dim, new_newton_hyperparameters[0], new_newton_hyperparameters.data() + 1); */
    /* GaussianProcess gp_model(covariance_opt, points_sampled.data(), points_sampled_value.data(), */
    /*         noise_variance.data(), dim, num_sampled); */

    /* // remaining inputs to EI optimization */
    /* // just an arbitrary point set for when num_being_sampled = 2, as in the default setting for this demo */
    /* std::vector<double> points_being_sampled(num_being_sampled*dim); */
    /* if (num_being_sampled == 2) { */
    /*     points_being_sampled[0] = 0.3; points_being_sampled[1] = 2.7; points_being_sampled[2] = 2.2; */
    /*     points_being_sampled[3] = -0.2; points_being_sampled[4] = 0.6; points_being_sampled[5] = 1.9; */
    /* } */

    /* // multithreading */
    /* int max_num_threads = 2;  // feel free to experiment with different numbers */
    /* ThreadSchedule thread_schedule(max_num_threads, omp_sched_dynamic); */

    /* // set up RNG containers */
    /* int64_t pi_array[] = {314, 3141, 31415, 314159, 3141592, 31415926, 314159265, 3141592653, 31415926535, 314159265359};  // arbitrarily used digits of pi as seeds */
    /* std::vector<NormalRNG> normal_rng_vec(max_num_threads); */
    /* for (int i = 0; i < max_num_threads; ++i) { */
    /*     normal_rng_vec[i].SetExplicitSeed(pi_array[i]);  // to get repeatable results */
    /*     // call SetRandomizedSeed(base_seed, thread_id) to automatically choose 'random' seeds */
    /* } */

    /* double best_so_far = *std::min_element(points_sampled_value.begin(), points_sampled_value.end());  // this is simply the best function value seen to date */

    /* // gradient descent parameters */
    /* double gamma = 0.1;  // we decrease step size by a factor of 1/(iteration)^gamma */
    /* double pre_mult = 1.0;  // scaling factor */
    /* double max_relative_change_ei = 1.0; */
    /* double tolerance_ei = 1.0e-7; */
    /* int num_multistarts = 10;  // max number of multistarted locations */
    /* int max_num_steps = 500;  // maximum number of GD iterations per restart */
    /* int max_num_restarts = 20;  // number of restarts to run with GD */
    /* int num_steps_averaged = 0;  // number of steps to use in polyak-ruppert averaging */
    /* GradientDescentParameters gd_params(num_multistarts, max_num_steps, max_num_restarts, */
    /*         num_steps_averaged, gamma, */
    /*         pre_mult, max_relative_change_ei, tolerance_ei); */

    /* // EI evaluation parameters */
    /* int max_int_steps = 1000;  // number of monte carlo iterations */
    /* std::vector<double> next_point_winner(dim); */

    /* {  // optimize EI using a model with the optimized hyperparameters */
    /*     printf(OL_ANSI_COLOR_CYAN "OPTIMIZING EXPECTED IMPROVEMENT... (optimized hyperparameters)\n" OL_ANSI_COLOR_RESET); */
    /*     bool found_flag = false; */
    /*     ComputeOptimalPointsToSampleWithRandomStarts(gp_model, gd_params, domain, thread_schedule, */
    /*             points_being_sampled.data(), num_to_sample, */
    /*             num_being_sampled, best_so_far, max_int_steps, */
    /*             &found_flag, &uniform_generator, normal_rng_vec.data(), */
    /*             next_point_winner.data()); */
    /*     printf(OL_ANSI_COLOR_CYAN "EI OPTIMIZATION FINISHED (optimized hyperparameters). Success status: %s\n" OL_ANSI_COLOR_RESET, found_flag ? "True" : "False"); */
    /*     printf("Next best sample point according to EI (opt hyper):\n"); */
    /*     PrintMatrix(next_point_winner.data(), 1, dim); */

    /*     // check what the actual improvement would've been by sampling from our GP and comparing to best_so_far */
    /*     // put randomness in a known state */
    /*     gp_generator.SetExplicitSeed(31415); */
    /*     double function_value = gp_generator.SamplePointFromGP(next_point_winner.data(), 0.0);  // sample w/o noise */

    /*     printf(OL_ANSI_COLOR_CYAN "RESULT OF SAMPLING AT THE NEXT BEST POINT (positive improvement is better) WITH OPT HYPERPARMS:\n" OL_ANSI_COLOR_RESET); */
    /*     printf("new function value: %.18E, previous best: %.18E, difference (improvement): %.18E\n", function_value, best_so_far, best_so_far - function_value); */
    /* } */

    /* {  // optimize EI using a model with randomly chosen (incorrect) hyperparameters */
    /*     // see how we would've done with the wrong hyperparameters */
    /*     printf(OL_ANSI_COLOR_CYAN "OPTIMIZING EXPECTED IMPROVEMENT... (wrong hyperparameters) \n" OL_ANSI_COLOR_RESET); */

    /*     // choose some wrong hyperparameters */
    /*     std::vector<double> hyperparameters_wrong(nHyps); */
    /*     boost::uniform_real<double> uniform_double_for_wrong_hyperparameter(0.1, 0.5); */
    /*     CovarianceClass covariance_wrong(dim, 1.0, 1.0); */
    /*     FillRandomCovarianceHyperparameters(uniform_double_for_wrong_hyperparameter, &uniform_generator, */
    /*             &hyperparameters_wrong, &covariance_wrong); */
    /*     GaussianProcess gp_wrong_hyper(covariance_wrong, points_sampled.data(), points_sampled_value.data(), */
    /*             noise_variance.data(), dim, num_sampled); */

    /*     bool found_flag = false; */
    /*     ComputeOptimalPointsToSampleWithRandomStarts(gp_wrong_hyper, gd_params, domain, thread_schedule, */
    /*             points_being_sampled.data(), num_to_sample, */
    /*             num_being_sampled, best_so_far, max_int_steps, */
    /*             &found_flag, &uniform_generator, normal_rng_vec.data(), */
    /*             next_point_winner.data()); */
    /*     printf(OL_ANSI_COLOR_CYAN "EI OPTIMIZATION FINISHED (wrong hyperparameters). Success status: %s\n" OL_ANSI_COLOR_RESET, found_flag ? "True" : "False"); */
    /*     printf("Next best sample point according to EI (wrong hyper):\n"); */
    /*     PrintMatrix(next_point_winner.data(), 1, dim); */

    /*     // check what the actual improvement would've been by sampling from our GP with wrong hyperparameters and comparing to best_so_far */
    /*     // Not sure if this comparison is valid; maybe gp_generator needs to have the same random state for both calls to */
    /*     // SamplePointFromGP?  Or maybe it only makes sense to look after repeated calls?  I think putting the PRNG in the same */
    /*     // state for both draws is a reasonable comparison, since then we have two identical GPs */

    /*     // put gp_generator in same prng state as when we did the draw for the optimized hyperparameter result */
    /*     gp_generator.ResetToMostRecentSeed(); */
    /*     double function_value = gp_generator.SamplePointFromGP(next_point_winner.data(), 0.0);  // sample w/o noise */
    /*     printf(OL_ANSI_COLOR_CYAN "RESULT OF SAMPLING AT THE NEXT BEST POINT (positive improvement is better) WITH WRONG HYPERPARAMS:\n" OL_ANSI_COLOR_RESET); */
    /*     printf("new function value: %.18E, previous best: %.18E, difference (improvement): %.18E\n", function_value, best_so_far, best_so_far - function_value); */
    /* } */
    json j;
    /* j["next"] = next_point_winner; */
    return j;
}
