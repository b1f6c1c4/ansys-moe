#pragma once
#include "common.h"
#include <boost/program_options.hpp>
#include "rpc.h"

namespace po = boost::program_options;

class Main : public Logger
{
    LOGGABLE(Main);
public:

    RpcAnswer handler(const std::string &method, const json &data);

    void Setup(const po::variables_map &vm);

    void EventLoop();
};
