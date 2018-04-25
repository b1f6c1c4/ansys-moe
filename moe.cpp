/*!
  \file gpp_expected_improvement_demo.cpp
  \rst
  ``moe/optimal_learning/cpp/gpp_expected_improvement_demo.cpp``

  This is a demo for the Gaussian Process and (optimization of) Expected Improvement
  capabilities present in this project.  These capabilities live in gpp_math.

  The layout is:

  1. Set up input data sizes
  2. Specify hyperparameters
  3. Generate (random) set of sampled point locations, noise variances
  4. Generate data for the Gaussian Process Prior:

     a. Use a randomly constructed Gaussian Process to generate imaginary objective function values, OR
     b. Use user-provided input training data.\*
        \* By defining OL_USER_INPUTS to 1, you can specify your own input data.

  5. Select desired concurrent experiment locations (points_being_sampled)
  6. Construct Gaussian Process to model the training data "world"
  7. Optimize Expected Improvement to decide what point we would sample next

  The random case will be generated by repeatedly drawing from a GP at randomly
  chosen locations.  For real-world use cases (or in the case of user-provided data),
  we use the GP as a surrogate model.  For the random case, the surrogate and "reality"
  are the same.

  Then we run Expected Improvement optimization with our GP to produce the next-best
  point to sample.  This highlights the core ideas in the optimal_learining project:
  GP construction and usage (as a surrogate model) through expected improvement
  optimization to produce "good" new samples.

  Please read and understand the file comments for gpp_math.hpp (and cpp for developers)
  before going through this example.  It also wouldn't hurt to look at gpp_covariance.hpp.
\endrst*/

#include <cstdio>

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

using namespace optimal_learning;  // NOLINT, i'm lazy in this file which has no external linkage anyway

#define OL_USER_INPUTS 0

void TryMoe() {
  using DomainType = TensorProductDomain;
  // here we set some configurable parameters
  // feel free to change them (and recompile) as you explore
  // comments next to each parameter will indicate its purpose and domain

  // the "spatial" dimension, aka the number of independent (experiment) parameters
  // i.e., this is the dimension of the points in points_sampled and points_being_sampled
  static const int dim = 3;  // > 0

  // number of points to optimize simultaneously (for simult experiments); "q" in q,p-EI
  static const int num_to_sample = 1;  // >= 1

  // number of concurrent samples running alongside the optimization; "p" in q,p-EI
  // e.g., num_being_sampled = 0 means EI optimization will produce the single point
  // that maximizes EI
  // with num_being_sampled = 2 (for example), EI optimization will assume that the
  // specified 2 points are \emph{already} being sampled, yielding the next best point
  // outside of these
  // Note: if this value is 0 and num_to_sample == 1, then we reach a special case of EI
  // that can be computed analytically
  static const int num_being_sampled = 2;  // >= 0

  // number of points that we have already sampled; i.e., size of the training set
  static const int num_sampled = 10;  // >= 0

  // multithreading
  int max_num_threads = 1;  // feel free to experiment with different numbers
  ThreadSchedule thread_schedule(max_num_threads, omp_sched_dynamic);

  // set up RNG containers
  int64_t pi_array[] = {314, 3141, 31415, 314159, 3141592, 31415926, 314159265, 3141592653, 31415926535, 314159265359};  // arbitrarily used digits of pi as seeds
  std::vector<NormalRNG> normal_rng_vec(max_num_threads);
  for (int i = 0; i < max_num_threads; ++i) {
    normal_rng_vec[i].SetExplicitSeed(pi_array[i]);  // to get repeatable results
    // call SetRandomizedSeed(base_seed, thread_id) to automatically choose 'random' seeds
  }
  UniformRandomGenerator uniform_generator(pi_array[0]);  // repeatable results
  // construct with (base_seed, thread_id) to generate a 'random' seed

  // specifies the domain of each independent variable in (min, max) pairs
  // set appropriately for user-specified inputs
  // mostly irrelevant for randomly generated inputs
  std::vector<ClosedInterval> domain_bounds = {
    {-1.5, 2.3},  // first dimension
    {0.1, 3.1},   // second dimension
    {1.7, 2.9}};  // third dimension
  DomainType domain(domain_bounds.data(), dim);

  // now we allocate point sets; ALL POINTS MUST LIE INSIDE THE DOMAIN!

  std::vector<double> points_being_sampled(num_being_sampled*dim);

  std::vector<double> points_sampled(num_sampled*dim);

  std::vector<double> points_sampled_value(num_sampled);

  // default to 0 noise
  std::vector<double> noise_variance(num_sampled, 0.0);  // each entry must be >= 0.0
  // choosing too much noise makes little sense: cannot make useful predictions if data
  // is drowned out by noise
  // choosing 0 noise is dangerous for large problems; the covariance matrix becomes very
  // ill-conditioned, and adding noise caps the maximum condition number at roughly
  // 1.0/min(noise_variance)

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

  // now fill data
#if OL_USER_INPUTS == 1
  // if you prefer, insert your own data here
  // requirements aka variables that must be set:
  // noise variance, num_sampled values: defaulted to 0; need to set this for larger data sets to deal with conditioning
  // points_sampled, num_sampled*dim values: the locations of already-sampled points; must be INSIDE the domain
  // points_sampled_value, num_sampled values: the function values at the already-sampled points
  // points_being_sampled, num_being_sampled*dim values: the locations of points being concurrently sampled

  // NOTE: the GP is 0-mean, so shift your points_sampled_value entries accordingly
  // e.g., if the samples are from a function with mean M, subtract it out
#else
  // generate GP inputs randomly

  // set noise
  std::fill(noise_variance.begin(), noise_variance.end(), 1.0e-2);  // arbitrary choice

  // use latin hypercube sampling to get a reasonable distribution of training point locations
  domain.GenerateUniformPointsInDomain(num_sampled, &uniform_generator, points_sampled.data());

  // build an empty GP: since num_sampled (last arg) is 0, none of the data arrays will be used here
  GaussianProcess gp_generator(covariance_original, points_sampled.data(), points_sampled_value.data(),
                               noise_variance.data(), dim, 0);
  // fill the GP with randomly generated data
  FillRandomGaussianProcess(points_sampled.data(), noise_variance.data(), dim, num_sampled,
                            points_sampled_value.data(), &gp_generator);

  // set points_being_sampled
  // doing this arbitrarily here, but you could imagine running EI opt once with 0 points_being_sampled,
  // producing result Xs_0.  Then you rerun EI with 1 points_being_sampled = Xs_0, producing Xs_1.
  // Then you run again with 2 points_being_sampled = {Xs_0, Xs_1}.

  // just an arbitrary point set for when num_being_sampled = 2, as in the default setting for this demo
  if (num_being_sampled == 2) {
    points_being_sampled[0] = 0.3; points_being_sampled[1] = 2.7; points_being_sampled[2] = 2.2;
    points_being_sampled[3] = -0.2; points_being_sampled[4] = 0.6; points_being_sampled[5] = 1.9;
  }
#endif

  printf(OL_ANSI_COLOR_CYAN "BUILDING GAUSSIAN PROCESS...\n" OL_ANSI_COLOR_RESET);

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
  double tolerance = 1.0e-7;
  int num_multistarts = 30;  // max number of multistarted locations
  int max_num_steps = 500;  // maximum number of GD iterations per restart
  int max_num_restarts = 20;  // number of restarts to run with GD
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
  printf(OL_ANSI_COLOR_CYAN "OPTIMIZING EXPECTED IMPROVEMENT...\n" OL_ANSI_COLOR_RESET);
  std::vector<double> next_point_winner(dim);
  bool found_flag = false;
  ComputeOptimalPointsToSampleWithRandomStarts(gp, gd_params, domain, thread_schedule,
                                               points_being_sampled.data(), num_to_sample,
                                               num_being_sampled, best_so_far, max_int_steps,
                                               &found_flag, &uniform_generator, normal_rng_vec.data(),
                                               next_point_winner.data());
  printf(OL_ANSI_COLOR_CYAN "EI OPTIMIZATION FINISHED. Success status: %s\n" OL_ANSI_COLOR_RESET, found_flag ? "True" : "False");
  printf("Next best sample point according to EI:\n");
  PrintMatrix(next_point_winner.data(), 1, dim);

  // check what the actual improvement would've been by sampling from our GP and comparing to best_so_far
  double function_value = gp.SamplePointFromGP(next_point_winner.data(), 0.0);  // sample w/o noise
  printf(OL_ANSI_COLOR_CYAN "RESULT OF SAMPLING AT THE NEXT BEST POINT (positive improvement is better):\n" OL_ANSI_COLOR_RESET);
  printf("new function value: %.18E, previous best: %.18E, difference (improvement): %.18E\n", function_value, best_so_far, best_so_far - function_value);
}
