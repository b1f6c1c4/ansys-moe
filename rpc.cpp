#include "rpc.h"

RpcMessage Rpc::executeRpcs(const std::string &str, RpcHandler executer)
{
    json reqs;
    try
    {
        logger->debug("Try parse json...");
        reqs = std::move(json::parse(str));
        if (reqs.is_object())
        {
            logger->trace("Single jsonrpc");
            auto &&j = executeRpc(reqs, executer);
            logger->trace("Execution succeed");
            logger->trace("Persist: {}", j.persist);
            return j;
        }
        if (reqs.is_array() && !reqs.empty())
        {
            logger->trace("Batch jsonrpc");
            auto errored = false;
            RpcMessage j{ json::array(), false };
            auto &&ress = j.message;
            for (auto &&it : reqs)
            {
                if (!it.is_object())
                {
                    logger->error("Batch verify wrong");
                    errored = true;
                    break;
                }
                logger->trace("Single jsonrpc in batch");
                auto &&j0 = executeRpc(it, executer);
                ress.push_back(std::move(j0.message));
                j.persist |= j0.persist;
            }
            if (!errored)
            {
                logger->trace("Execution all succeed");
                logger->trace("Persist: {}", j.persist);
                return j;
            }
        }

        logger->error("Invalid jsonrpc");
        json res;
        res["jsonrpc"] = "2.0";
        res["id"] = nullptr;
        res["error"]["code"] = -32600;
        res["error"]["message"] = "Invalid Request";
        return RpcMessage{ res, false };
    }
    catch (std::exception)
    {
        logger->error("Json parse error");
        json res;
        res["jsonrpc"] = "2.0";
        res["id"] = nullptr;
        res["error"]["code"] = -32700;
        res["error"]["message"] = "Parse error";
        return RpcMessage { res, false };
    }
}

RpcMessage Rpc::executeRpc(const json &req, RpcHandler executer)
{
    logger->trace("executeRpc core");

    json res;
    res["jsonrpc"] = "2.0";
    res["id"] = nullptr;

    std::string method;
    auto persist = false;
    try
    {
        logger->trace("Getting id");
        res["id"] = req.at("id");
        if (req.at("id").is_string()
            && req.at("id").size() >= 1) {
            auto ch = req.at("id").get<std::string>()[0];
            if (ch == '{' || ch == '[') {
                logger->info("Persist set to true");
                persist = true;
            }
        }
        logger->trace("Getting method");
        if (!req.at("method").is_string())
            throw std::invalid_argument{"method"};
        method = req["method"];
        logger->debug("Method: {}", method);
    }
    catch (const std::exception &ex)
    {
        logger->error(ex.what());
        res["error"]["code"] = -32600;
        res["error"]["message"] = "Invalid Request";
        return RpcMessage { res, persist };
    }

    json par;
    try
    {
        par = req.at("param");
        logger->debug("Param: defined");
    }
    catch (std::exception)
    {
        logger->debug("Param: undefined");
        par = nullptr;
    }

    try
    {
        logger->trace("Calling executer");
        auto &&result = executer(method, par);
        logger->trace("Returned from executer, code {}", result.code);
        if (result.code == 0)
        {
            res["result"] = result.data;
        }
        else
        {
            logger->warn("Executer: {}, {}", result.code, result.message);
            res["error"]["code"] = result.code;
            res["error"]["message"] = result.message;
            if (result.data != nullptr)
                res["error"]["data"] = result.data;
        }
        return RpcMessage { res, persist };
    }
    catch (const std::exception &ex)
    {
        logger->error(ex.what());
        res["error"]["code"] = -32603;
        res["error"]["message"] = "Internal error";
        return RpcMessage { res, persist };
    }
}

// LCOV_EXCL_START
void Rpc::setupRpc(const std::string &sub)
{
    logger->trace("setupRpc()");
    m_ChannelName = sub;
    logger->info("Channel name set to {}", m_ChannelName);

    auto rawHost = std::getenv("RABBIT_HOST");
    auto rawUsername = std::getenv("RABBIT_USER");
    auto rawPassword = std::getenv("RABBIT_PASS");
    std::string host = "localhost";
    std::string username = "guest";
    std::string password = "guest";
    if (rawHost != nullptr)
        host = std::string(rawHost);
    if (rawUsername != nullptr)
        username = std::string(rawUsername);
    if (rawPassword != nullptr)
        password = std::string(rawPassword);

    logger->info("Connecting {}", host);
    logger->info("Username {}", username);
    logger->debug("Channel::Create ...");
    m_Channel = AmqpClient::Channel::Create(host, 5672, username, password);
    logger->trace("Channel::Create done");

    logger->debug("Channel::Declare ...");
    m_Channel->DeclareQueue(m_ChannelName, false, true, false, false);
    logger->trace("Channel::Declare done");
}

#ifndef IS_TEST_MAIN
void Rpc::runRpc(RpcHandler executer)
{
    logger->trace("runRpc()");

    logger->debug("Channel::BasicConsume...");
    auto &&consumerTag = m_Channel->BasicConsume(m_ChannelName, "", true, false, false, 1);
    logger->info("Consumer tag: {}", consumerTag);

    logger->info("Entering event loop");
    while (true)
        try
        {
            logger->trace("Channel::BasicConsumeMessage...");
            auto &&envelope = m_Channel->BasicConsumeMessage(consumerTag);
            logger->trace("Channel::BasicConsumeMessage done");
            auto &&message = envelope->Message();
            auto &&body = message->Body();
            auto &&replyTo = message->ReplyTo();
            logger->info("Message from {}", replyTo);
            if (replyTo.empty())
            {
                logger->warn("replyTo is empty");
                logger->trace("Channel::BasicReject...");
                m_Channel->BasicReject(envelope, false);
                logger->trace("Channel::BasicReject done");
                continue;
            }

            logger->trace("executeRpcs...");
            auto &&res = executeRpcs(body, executer);

            logger->trace("dump json...");
            auto &&str = res.message.dump();

            logger->trace("BasicMessage::Create");
            auto &&reply = AmqpClient::BasicMessage::Create(str);
            reply->DeliveryMode(res.persist
                ? AmqpClient::BasicMessage::dm_persistent
                : AmqpClient::BasicMessage::dm_nonpersistent);
            logger->trace("Channel::BasicPublish...");
            m_Channel->BasicPublish("", replyTo, reply, false, false);
            logger->trace("Channel::BasicPublish done");

            logger->trace("Channel::BasicAck...");
            m_Channel->BasicAck(envelope);
            logger->trace("Channel::BasicAck done");
        }
        catch (const std::exception &ex)
        {
            logger->error(ex.what());
        }
}
#endif
// LCOV_EXCL_STOP
