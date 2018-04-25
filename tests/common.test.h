#define BOOST_TEST_DYN_LINK
#include <boost/test/included/unit_test.hpp>
#include <boost/test/unit_test_parameters.hpp>
#include <boost/test/data/test_case.hpp>
#include "../common.h"

using namespace boost::unit_test;

class LoggerSetter
{
public:
    inline LoggerSetter()
    {
        auto lvl = runtime_config::get<log_level>(runtime_config::btrt_log_level);
        if (lvl <= log_successful_tests)
            spdlog::set_level(spdlog::level::trace);
        else if (lvl <= log_test_units)
            spdlog::set_level(spdlog::level::critical);
        else
            spdlog::set_level(spdlog::level::off);
    }
};

BOOST_TEST_GLOBAL_FIXTURE(LoggerSetter);
