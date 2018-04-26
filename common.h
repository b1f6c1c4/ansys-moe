#pragma once
#include <vector>
#include <string>
#include <boost/core/noncopyable.hpp>
#include <spdlog/spdlog.h>
#include <spdlog/fmt/ostr.h>
#include <json.hpp>

using json = nlohmann::json;

#ifndef VERSION
#define VERSION "UNKNOWN"
#endif

#ifndef COMMITHASH
#define COMMITHASH "UNKNOWN"
#endif

#define LOGGABLE(cls) \
    private: \
        inline cls() : Logger(#cls) \
        { \
            logger->debug(#cls " initialized"); \
        } \
    public: \
        static inline cls &Inst() \
        { \
            static cls inst; \
            return inst; \
        }

class Logger : private boost::noncopyable
{
protected:
    inline explicit Logger(std::string &&name) : logger(spdlog::stderr_color_mt(name)) {}

    std::shared_ptr<spdlog::logger> logger;
};

template <typename T>
std::ostream &operator<<(std::ostream &out, const std::vector<T> &v)
{
    if (!v.empty())
    {
        out << "[";
        std::copy(v.begin(), v.end(), std::ostream_iterator<T>(out, ", "));
        out << "\b\b]";
    }
    else
    {
        out << "[]";
    }
    return out;
}
