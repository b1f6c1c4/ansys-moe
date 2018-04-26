#include "main.h"
#include <iostream>
#include "moe.h"

void Main::Setup(const po::variables_map &vm)
{
    auto &&verbose = vm["verbose"].as<std::string>();
    if (verbose == "trace") {
        spdlog::set_level(spdlog::level::trace);
    } else if (verbose == "debug") {
        spdlog::set_level(spdlog::level::debug);
    } else if (verbose == "info") {
        spdlog::set_level(spdlog::level::info);
    } else if (verbose == "warn") {
        spdlog::set_level(spdlog::level::warn);
    } else if (verbose == "error") {
        spdlog::set_level(spdlog::level::err);
    } else if (verbose == "fatal") {
        spdlog::set_level(spdlog::level::critical);
    } else if (verbose == "off") {
        spdlog::set_level(spdlog::level::off);
    } else {
        logger->warn("vm.verbose unknown {}", verbose);
        spdlog::set_level(spdlog::level::info);
    }

    logger->info("Version {}", VERSION);
    logger->info("CommitHash {}", COMMITHASH);

    logger->debug("Setup done");
}

void Main::Execute()
{
    try {
        json input;
        std::cin >> input;
        logger->info("Input parsed");
        logger->trace("Input {}", input.dump());
        auto &&output = Moe::Inst().Execute(input);
        logger->info("Done");
        logger->trace("Output {}", output.dump());
        if (isatty(fileno(stdout))) {
            std::cout << std::setw(2) << output << std::endl;
        } else {
            std::cout << output;
        }
    } catch (const std::exception &ex) {
        logger->error(ex.what());
        std::cout << "ERROR" << std::endl;
        std::cout << ex.what();
        if (isatty(fileno(stdout))) {
            std::cout << std::endl;
        }
    }
}

int main(int argc, char *argv[])
{
    try
    {
        po::options_description desc("Allowed options");
        desc.add_options()
            ("help,h", "produce help message")
            ("verbose,v", po::value<std::string>()->default_value("info"), "set logging level")
        ;

        po::variables_map vm;
        po::store(po::parse_command_line(argc, argv, desc), vm);
        po::notify(vm);

        if (vm.count("help")) {
            std::cout << desc << std::endl;
            return 1;
        }

        Main::Inst().Setup(vm);
        Main::Inst().Execute();
    }
    catch (const spdlog::spdlog_ex &ex)
    {
        std::cout << "VERSION=" << VERSION << std::endl;
        std::cout << "COMMITHASH=" << COMMITHASH << std::endl;
        std::cout << "Log init failed: " << ex.what() << std::endl;
        return 1;
    }
    return 0;
}
