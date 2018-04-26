#include "moe.h"

#include <algorithm>
#include <vector>

#include <gpp_common.hpp>
#include <gpp_covariance.hpp>
#include <gpp_domain.hpp>
#include <gpp_logging.hpp>
#include <gpp_math.hpp>
#include <gpp_optimization.hpp>
#include <gpp_optimizer_parameters.hpp>
#include <gpp_random.hpp>
#include <gpp_test_utils.hpp>

using namespace optimal_learning;

json Moe::Execute(const json &command) {
  using DomainType = TensorProductDomain;
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

  // covariance selection
  using CovarianceClass = SquareExponential;  // see gpp_covariance.hpp for other options

  std::vector<double> hyperparameters_original(1 + dim);
  hyperparameters_original[0] = 0.8;  // alpha aka \sigma_f^2
  hyperparameters_original[1] = 1.1;  // length scale, first dimension
  hyperparameters_original[2] = 0.6;  // length scale, second dimension
  hyperparameters_original[3] = 0.2;  // length scale, third dimension
  CovarianceClass covariance_original(dim, hyperparameters_original[0], hyperparameters_original.data() + 1);
  // CovarianceClass provides SetHyperparameters, GetHyperparameters to read/modify
  // hyperparameters later on

  logger->info("BUILDING GAUSSIAN PROCESS...");

  // construct GP
  // first, we simulate not knowing the actual hyperparameters by picking a new set of random ones that are roughly
  // in the same range the actual ones
  // feel free to experiment and see what happens when the guessed hyperparameters are way wrong
  std::vector<double> hyperparameters_perturbed(covariance_original.GetNumberOfHyperparameters());
  boost::uniform_real<double> uniform_double_for_wrong_hyperparameter(0.01, 5.0);
  CovarianceClass covariance_perturbed(dim, 1.0, 1.0);
  FillRandomCovarianceHyperparameters(uniform_double_for_wrong_hyperparameter, &uniform_generator,
                                      &hyperparameters_perturbed, &covariance_perturbed);

  // Note: with random data generation, technically we already have the GP ready since
  // we have been progressively adding new points to it.  Still we will construct a new GP
  // for the purpose of demonstration
  GaussianProcess gp(covariance_perturbed, points_sampled.data(), points_sampled_value.data(),
                     noise_variance.data(), dim, num_sampled);

  // remaining inputs to EI optimization
  double best_so_far = *std::min_element(points_sampled_value.begin(), points_sampled_value.end());  // this is simply the best function value seen to date

  // gradient descent parameters
  double gamma = 0.1;  // we decrease step size by a factor of 1/(iteration)^gamma
  double pre_mult = 1.0;  // scaling factor
  double max_relative_change = 1.0;
  double tolerance = 1.0e-3;
  int num_multistarts = 3;  // max number of multistarted locations
  int max_num_steps = 50;  // maximum number of GD iterations per restart
  int max_num_restarts = 2;  // number of restarts to run with GD
  int num_steps_averaged = 0;  // number of steps to use in polyak-ruppert averaging
  GradientDescentParameters gd_params(num_multistarts, max_num_steps, max_num_restarts,
                                      num_steps_averaged, gamma,
                                      pre_mult, max_relative_change, tolerance);
  // so the total number of GD iterations is at most:
  // num_multistarts * max_num_restarts * max_num_steps

  // in general, do not set max_num_steps OR gamma too high.  Due to the step-size scaling w/gamma,
  // eventually GD will be forced to take meaninglessly tiny steps.
  // instead, use more restarts (max_outer) to get GD to cover more distance per multistart

  // EI evaluation parameters
  int max_int_steps = 1000;  // number of monte carlo iterations
  // note: this quantity is NOT used if num_being_sampled = 0.  In that case, an anlytic
  // formula is used to compute EI, obviating the need for monte-carlo.

  // WARNING: in the analytic case (being_sampled = \emptyset) and even using 1000000 mc iterations, we see only about
  // 5.0e-4 matching between analytic vs mc EI, and only about 1.5e-2 between analytic vs mc gradient of EI.  MC
  // converges VERY slowly and 1000 iterations is probably nowhere near enough.  (But you probably do not want to wait 1000x as long!)

  // Still, without changing any other setup, try setting num_being_sampled = 0; even with so few MC iterations and the added
  // complexity of points_being_sampled, the results are (usually) similar.

  // Finally: optimize EI!
  // Note: this generates a large amount of output to stdout.  This could be surpressed and it's unclear what is due to
  // poor GD configuration vs insufficient accuracy/consistency in the EI computation
  logger->info("OPTIMIZING EXPECTED IMPROVEMENT...");
  std::vector<double> next_point_winner(dim);
  bool found_flag = false;
  ComputeOptimalPointsToSampleWithRandomStarts(gp, gd_params, domain, thread_schedule,
                                               points_being_sampled.data(), num_to_sample,
                                               num_being_sampled, best_so_far, max_int_steps,
                                               &found_flag, &uniform_generator, normal_rng_vec.data(),
                                               next_point_winner.data());
  logger->info("EI OPTIMIZATION FINISHED. Success status: {}", found_flag ? "True" : "False");

  // check what the actual improvement would've been by sampling from our GP and comparing to best_so_far
  double function_value = gp.SamplePointFromGP(next_point_winner.data(), 0.0);  // sample w/o noise
  logger->info("RESULT OF SAMPLING AT THE NEXT BEST POINT (positive improvement is better):");
  logger->info("new function value: {}, previous best: {}, difference (improvement): {}", function_value, best_so_far, best_so_far - function_value);
  json j;
  j["next"] = next_point_winner;
  return j;
}
