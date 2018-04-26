#pragma once
#include "common.h"
#include <boost/program_options.hpp>

namespace po = boost::program_options;

class Main : public Logger
{
    LOGGABLE(Main);
public:

    void Setup(const po::variables_map &vm);

    void Execute();
};
