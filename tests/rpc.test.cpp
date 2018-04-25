#define BOOST_TEST_MODULE rpc
#include "common.test.h"

#include "../rpc.h"

RpcAnswer handler(const std::string &method, const json &data)
{
    if (method == "echo")
        return data;
    if (method == "empty-error")
        return RpcAnswer(1, "Some error");
    if (method == "error")
        return RpcAnswer(1, "Some error", data);
    if (method == "throw")
        throw std::runtime_error{"Test exception"};
    return RpcAnswer(-32601, "Method not found");
}

BOOST_AUTO_TEST_SUITE(executeRpcs_test);

BOOST_AUTO_TEST_CASE(parseError)
{
    auto &&j = Rpc::Inst().executeRpcs("asdf", &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32700);
    BOOST_TEST(j.message["id"] == nullptr);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(invalidRequest_empty)
{
    auto &&j = Rpc::Inst().executeRpcs("[]", &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32600);
    BOOST_TEST(j.message["id"] == nullptr);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(invalidRequest_number)
{
    auto &&j = Rpc::Inst().executeRpcs("[123]", &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32600);
    BOOST_TEST(j.message["id"] == nullptr);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(invalidRequest_string)
{
    auto &&j = Rpc::Inst().executeRpcs("[\"str\"]", &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32600);
    BOOST_TEST(j.message["id"] == nullptr);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(single)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "1234";
    r["id"] = "str";

    auto &&j = Rpc::Inst().executeRpcs(r.dump(), &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32601);
    BOOST_TEST(j.message["id"] == "str");
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(multiple)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "1234";
    r["id"] = "str";

    json rs = { r, r, r };

    auto &&js = Rpc::Inst().executeRpcs(rs.dump(), &handler);
    for (auto i = 0; i < 3; i++)
    {
        auto &&j = js.message[i];
        BOOST_TEST(j["jsonrpc"] == "2.0");
        BOOST_TEST(j["error"]["code"] == -32601);
        BOOST_TEST(j["id"] == "str");
    }
    BOOST_TEST(js.persist == false);
}

BOOST_AUTO_TEST_CASE(multiple_persist1)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "1234";
    r["id"] = "str";
    json rp;
    rp["jsonrpc"] = "2.0";
    rp["method"] = "1234";
    rp["id"] = "{str";

    json rs = { r, rp, r };

    auto &&js = Rpc::Inst().executeRpcs(rs.dump(), &handler);
    for (auto i = 0; i < 3; i++)
    {
        auto &&j = js.message[i];
        BOOST_TEST(j["jsonrpc"] == "2.0");
        BOOST_TEST(j["error"]["code"] == -32601);
        if (i == 1)
            BOOST_TEST(j["id"] == "{str");
        else
            BOOST_TEST(j["id"] == "str");
    }
    BOOST_TEST(js.persist == true);
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(executeRpc_test);

BOOST_AUTO_TEST_CASE(invalidRequest_noid)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "123";
    r["params"] = "qwer";

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32600);
    BOOST_TEST(j.message["id"] == nullptr);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(invalidRequest_nomethod)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["params"] = "qwer";
    r["id"] = "aaa";

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32600);
    BOOST_TEST(j.message["id"] == "aaa");
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(invalidRequest_method)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = 123;
    r["params"] = "qwer";
    r["id"] = "aaa";

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32600);
    BOOST_TEST(j.message["id"] == "aaa");
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(methodNotFound_number)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "1234";
    r["id"] = 12;

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32601);
    BOOST_TEST(j.message["id"] == 12);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(methodNotFound_string)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "1234";
    r["id"] = "str";

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32601);
    BOOST_TEST(j.message["id"] == "str");
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(methodNotFound_null)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "1234";
    r["id"] = nullptr;

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32601);
    BOOST_TEST(j.message["id"] == nullptr);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(echo)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "echo";
    r["param"]["key"] = "value";
    r["id"] = 123;

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["result"]["key"] == "value");
    BOOST_TEST(j.message["id"] == 123);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(throws)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "throw";
    r["param"]["key"] = "value";
    r["id"] = 123;

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == -32603);
    BOOST_TEST(j.message["id"] == 123);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(emptyError)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "empty-error";
    r["param"]["key"] = "value";
    r["id"] = 123;

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == 1);
    BOOST_TEST(j.message["error"]["message"] == "Some error");
    BOOST_CHECK_THROW(j.message["error"].at("data").is_object(), nlohmann::detail::out_of_range);
    BOOST_TEST(j.message["id"] == 123);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(error)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "error";
    r["param"]["key"] = "value";
    r["id"] = 123;

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == 1);
    BOOST_TEST(j.message["error"]["message"] == "Some error");
    BOOST_TEST(j.message["error"]["data"]["key"] == "value");
    BOOST_TEST(j.message["id"] == 123);
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(error_persist0)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "error";
    r["param"]["key"] = "value";
    r["id"] = "";

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == 1);
    BOOST_TEST(j.message["error"]["message"] == "Some error");
    BOOST_TEST(j.message["error"]["data"]["key"] == "value");
    BOOST_TEST(j.message["id"] == "");
    BOOST_TEST(j.persist == false);
}

BOOST_AUTO_TEST_CASE(error_persist1)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "error";
    r["param"]["key"] = "value";
    r["id"] = "{";

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == 1);
    BOOST_TEST(j.message["error"]["message"] == "Some error");
    BOOST_TEST(j.message["error"]["data"]["key"] == "value");
    BOOST_TEST(j.message["id"] == "{");
    BOOST_TEST(j.persist == true);
}

BOOST_AUTO_TEST_CASE(error_persist2)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "error";
    r["param"]["key"] = "value";
    r["id"] = "[";

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == 1);
    BOOST_TEST(j.message["error"]["message"] == "Some error");
    BOOST_TEST(j.message["error"]["data"]["key"] == "value");
    BOOST_TEST(j.message["id"] == "[");
    BOOST_TEST(j.persist == true);
}

BOOST_AUTO_TEST_CASE(error_persist3)
{
    json r;
    r["jsonrpc"] = "2.0";
    r["method"] = "error";
    r["param"]["key"] = "value";
    r["id"] = "{}";

    auto &&j = Rpc::Inst().executeRpc(r, &handler);
    BOOST_TEST(j.message["jsonrpc"] == "2.0");
    BOOST_TEST(j.message["error"]["code"] == 1);
    BOOST_TEST(j.message["error"]["message"] == "Some error");
    BOOST_TEST(j.message["error"]["data"]["key"] == "value");
    BOOST_TEST(j.message["id"] == "{}");
    BOOST_TEST(j.persist == true);
}

BOOST_AUTO_TEST_SUITE_END();
