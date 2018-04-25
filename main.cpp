#include "main.h"
#include <iostream>
#include "rpc.h"
#include "ring.h"

#ifndef IS_TEST
extern size_t g_WIDTH_BIT;
#endif

RpcAnswer Main::handler(const std::string &method, const json &data)
{
    try
    {
        if (method == "status")
        {
            logger->info("Method {} called", method);
            json j;
            j["version"] = VERSION;
            j["commitHash"] = COMMITHASH;
            return j;
        }
        else if (method == "newRing")
        {
            logger->info("Method {} called", method);
            return Ring::Inst().newRing();
        }
        else if (method == "genH")
        {
            logger->info("Method {} called", method);
            return Ring::Inst().genH(data);
        }
        else if (method == "verify")
        {
            logger->info("Method {} called", method);
            json j;
            auto res = Ring::Inst().verify(data);
            j["valid"] = res ? 1 : 0;
            return j;
        }
        else
        {
            logger->error("Method {} not found", method);
            return RpcAnswer(-32601, "Method not found");
        }
    }
    catch (const nlohmann::detail::type_error &ex)
    {
        logger->error(ex.what());
        return RpcAnswer(-32602, "Invalid params");
    }
    catch (const std::exception &ex)
    {
        logger->error(ex.what());
        throw;
    }
}

// LCOV_EXCL_START
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

#ifndef IS_TEST
    g_WIDTH_BIT = vm["width"].as<size_t>();

    logger->info("Crypto width bit {}", g_WIDTH_BIT);
#endif

    auto &&sub = vm["subscribe"].as<std::string>();
    logger->debug("Will subscribe {}", sub);
    Rpc::Inst().setupRpc(sub);
    logger->debug("Setup done");
}
// LCOV_EXCL_STOP

void Main::EventLoop()
{
    logger->info("Main::EventLoop");

    try
    {
        using namespace std::placeholders;
        logger->debug("Run rpc");
        Rpc::Inst().runRpc(std::bind(&Main::handler, this, _1, _2));
    }
    catch (const std::exception &ex)
    {
        logger->error(ex.what());
    }

    logger->warn("Crypto Exited.");
}

// LCOV_EXCL_START
#ifndef IS_TEST
int main(int argc, char *argv[])
{
    try
    {
        po::options_description desc("Allowed options");
        desc.add_options()
            ("help,h", "produce help message")
            ("verbose,v", po::value<std::string>()->default_value("info"), "set logging level")
            ("width,w", po::value<size_t>()->default_value(2048), "set crypto width (bit)")
            ("subscribe,s", po::value<std::string>()->default_value("cryptor"), "channel to listen")
        ;

        po::variables_map vm;
        po::store(po::parse_command_line(argc, argv, desc), vm);
        po::notify(vm);

        if (vm.count("help")) {
            std::cout << desc << std::endl;
            return 1;
        }

        Main::Inst().Setup(vm);
        Main::Inst().EventLoop();
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
#endif
// LCOV_EXCL_STOP
