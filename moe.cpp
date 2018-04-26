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

json Moe::Execute(const json &command)
{
    using DomainType = TensorProductDomain;
    using HyperparameterDomainType = TensorProductDomain;
    auto dim = command.at("D").size();
    auto num_to_sample = command.at("q").get<size_t>();
    auto num_being_sampled = command.at("current").size();
    auto num_sampled = command.at("done").size();
    size_t max_num_threads = 1;

    // set up RNG containers
    int64_t pi_array[] = {314, 3141, 31415, 314159, 3141592, 31415926, 314159265, 3141592653, 31415926535, 314159265359};  // arbitrarily used digits of pi as seeds
    std::vector<NormalRNG> normal_rng_vec(max_num_threads);
    for (size_t i = 0; i < max_num_threads; ++i) {
        normal_rng_vec[i].SetExplicitSeed(pi_array[i]);  // to get repeatable results
        // call SetRandomizedSeed(base_seed, thread_id) to automatically choose 'random' seeds
    }
    UniformRandomGenerator uniform_generator{};  // repeatable results
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

    CovarianceClass coverianceClass(dim, 1.0, 1.0);
    auto nHyps = coverianceClass.GetNumberOfHyperparameters();
    coverianceClass.SetHyperparameters(std::vector<double>{ 1, 2, 3, 2 }.data()); // TODO

    logger->debug("Initial hyperparameters {}", coverianceClass);

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

    size_t newton_max_num_steps = 5000;
    double gamma_newton = 1.05;
    double pre_mult_newton = 1.0e-1;
    double max_relative_change_newton = 1.0;
    double tolerance_newton = 1.0e-11;
    NewtonParameters newton_parameters(1, newton_max_num_steps, gamma_newton, pre_mult_newton, max_relative_change_newton, tolerance_newton);

    std::vector<double> new_newton_hyperparameters(nHyps);

    auto total_newton_errors = NewtonHyperparameterOptimization(
            log_marginal_eval,
            coverianceClass,
            newton_parameters,
            hyperparameter_domain,
            new_newton_hyperparameters.data()
            );
    coverianceClass.SetHyperparameters(new_newton_hyperparameters.data());

    logger->info("Result of Newton: {}", new_newton_hyperparameters);
    logger->debug("Estimated hyperparameters {}", coverianceClass);

    if (total_newton_errors > 0) {
        logger->warn("{} Newton runs exited due to singular Hessian matrices", total_newton_errors);
    }

    /* GaussianProcess gp_model( */
    /*         coverianceClass, */
    /*         points_sampled.data(), */
    /*         points_sampled_value.data(), */
    /*         noise_variance.data(), */
    /*         dim, */
    /*         num_sampled */
    /*         ); */

    /* ThreadSchedule thread_schedule(max_num_threads, omp_sched_dynamic); */

    /* auto best_so_far = *std::min_element(points_sampled_value.begin(), points_sampled_value.end()); */

    /* double gamma = 0.1; */
    /* double pre_mult = 1.0; */
    /* double max_relative_change_ei = 1.0; */
    /* double tolerance_ei = 1.0e-7; */
    /* size_t num_multistarts = 10; */
    /* size_t max_num_steps = 500; */
    /* size_t max_num_restarts = 20; */
    /* size_t num_steps_averaged = 0; */
    /* GradientDescentParameters gd_params( */
    /*         num_multistarts, */
    /*         max_num_steps, */
    /*         max_num_restarts, */
    /*         num_steps_averaged, */
    /*         gamma, */
    /*         pre_mult, */
    /*         max_relative_change_ei, */
    /*         tolerance_ei */
    /*         ); */

    /* size_t max_int_steps = 1000; */
    /* std::vector<double> next_point_winner(num_to_sample*dim); */

    /* logger->debug("Start EI optimization"); */
    /* auto found_flag = false; */
    /* ComputeOptimalPointsToSampleWithRandomStarts( */
    /*         gp_model, gd_params, domain, thread_schedule, */
    /*         points_being_sampled.data(), num_to_sample, */
    /*         num_being_sampled, best_so_far, max_int_steps, */
    /*         &found_flag, &uniform_generator, normal_rng_vec.data(), */
    /*         next_point_winner.data()); */
    /* if (found_flag) */
    /* { */
    /*     logger->info("EI optimization suceeed"); */
    /* } */
    /* else */
    /* { */
    /*     logger->warn("EI optimization failed"); */
    /* } */
    /* logger->info("Next point: {}", next_point_winner); */

    json j;
    /* j["next"] = next_point_winner; */
    return j;
}
