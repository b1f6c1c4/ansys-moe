#define BOOST_TEST_MODULE main
#include "common.test.h"
#include "../main.h"

#include "../ring.h"

bool g_throwStd;
bool g_throwParam;

void mayThrow()
{
    if (g_throwParam)
    {
        json j;
        j.at("non-exist");
        BOOST_FAIL("we shouldn't be there!");
    }

    if (g_throwStd)
        throw std::exception{};
}

// Borrow some implemention ...
#define IS_TEST_MAIN
#include "../rpc.cpp"

// .. and mock the rest ...
void Rpc::runRpc(RpcHandler executer)
{
    mayThrow();
}

// done

json Ring::newRing()
{
    mayThrow();
    return json{
        { "key", "newRing" },
    };
}

json Ring::genH(const json &param)
{
    mayThrow();
    return json{
        { "key", "genH" },
        { "echo", param.at("echo").get<std::string>() },
    };
}

bool Ring::verify(const json &param)
{
    mayThrow();
    return param.at("echo").get<std::string>() == "true";
}

BOOST_AUTO_TEST_SUITE(handler_test);

BOOST_AUTO_TEST_SUITE(throws_test);

auto &&listMethods = boost::unit_test::data::make({
    // "status",
    "newRing",
    "genH",
    "verify",
});

BOOST_DATA_TEST_CASE(throws_std, listMethods)
{
    g_throwStd = true;
    g_throwParam = false;

    json j;
    BOOST_CHECK_THROW(Main::Inst().handler("newRing", j), std::exception);
}

BOOST_DATA_TEST_CASE(throws_param, listMethods)
{
    g_throwStd = false;
    g_throwParam = true;

    json j;
    auto &&res = Main::Inst().handler("newRing", j);
    BOOST_TEST(res.code == -32602);
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_CASE(status_test)
{
    g_throwStd = false;
    g_throwParam = false;

    json j;
    auto &&res = Main::Inst().handler("status", j);
    BOOST_TEST(res.code == 0);
    BOOST_TEST(res.data["version"] == VERSION);
    BOOST_TEST(res.data["commitHash"] == COMMITHASH);
}

BOOST_AUTO_TEST_CASE(newRing_test)
{
    g_throwStd = false;
    g_throwParam = false;

    json j;
    auto &&res = Main::Inst().handler("newRing", j);
    BOOST_TEST(res.code == 0);
    BOOST_TEST(res.data["key"] == "newRing");
}

BOOST_AUTO_TEST_CASE(genH_test)
{
    g_throwStd = false;
    g_throwParam = false;

    json j;
    j["echo"] = "val";
    auto &&res = Main::Inst().handler("genH", j);
    BOOST_TEST(res.code == 0);
    BOOST_TEST(res.data["key"] == "genH");
    BOOST_TEST(res.data["echo"] == "val");
}

BOOST_AUTO_TEST_CASE(verify_test_true)
{
    g_throwStd = false;
    g_throwParam = false;

    json j;
    j["echo"] = "true";
    auto &&res = Main::Inst().handler("verify", j);
    BOOST_TEST(res.code == 0);
    BOOST_TEST(res.data["valid"] == 1);
}

BOOST_AUTO_TEST_CASE(verify_test_false)
{
    g_throwStd = false;
    g_throwParam = false;

    json j;
    j["echo"] = "val";
    auto &&res = Main::Inst().handler("verify", j);
    BOOST_TEST(res.code == 0);
    BOOST_TEST(res.data["valid"] == 0);
}

BOOST_AUTO_TEST_CASE(method_notfound)
{
    g_throwStd = false;
    g_throwParam = false;

    json j;
    auto &&res = Main::Inst().handler("non-exist", j);
    BOOST_TEST(res.code == -32601);
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(EventLoop_test);

BOOST_AUTO_TEST_CASE(nothrow)
{
    g_throwStd = false;
    g_throwParam = false;

    BOOST_CHECK_NO_THROW(Main::Inst().EventLoop());
}

BOOST_AUTO_TEST_CASE(always_nothrow)
{
    g_throwStd = true;
    g_throwParam = false;

    BOOST_CHECK_NO_THROW(Main::Inst().EventLoop());
}

BOOST_AUTO_TEST_SUITE_END();
