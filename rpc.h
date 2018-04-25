#pragma once
#include "common.h"
#include <functional>
#include <SimpleAmqpClient/SimpleAmqpClient.h>

struct RpcAnswer
{
    int64_t code = 0;
    std::string message;
    json data;

    inline RpcAnswer(int64_t c, const std::string &m) : code(c), message(m), data(nullptr) {}
    inline RpcAnswer(int64_t c, const std::string &m, json &&d) : code(c), message(m), data(std::move(d)) {}
    inline RpcAnswer(int64_t c, const std::string &m, const json &d) : code(c), message(m), data(d) {}
    inline RpcAnswer(json &&d) : data(std::move(d)) {}
    inline RpcAnswer(const json &d) : data(d) {}
};

struct RpcMessage
{
    json message;
    bool persist;
};

using RpcHandler = std::function<RpcAnswer (const std::string &method, const json &data)>;

class Rpc : public Logger
{
    LOGGABLE(Rpc);
public:

    RpcMessage executeRpcs(const std::string &str, RpcHandler executer);
    RpcMessage executeRpc(const json &req, RpcHandler executer);

    // LCOV_EXCL_START
    void setupRpc(const std::string &sub);
    void runRpc(RpcHandler executer);
    // LCOV_EXCL_STOP
private:
    std::string m_ChannelName;
    AmqpClient::Channel::ptr_t m_Channel;
};
