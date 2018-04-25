#define BOOST_TEST_MODULE ring
#include "common.test.h"

#include "../ring.h"

// Borrow some implemention ...
#define IS_TEST_RING
#include "../ringImpl.cpp"

// .. and mock the rest ...
RingData RingImpl::generate()
{
    RingData ring;
    ring.q = Integer(15485863);
    ring.g = Integer(6);
    return ring;
}

// done

BOOST_AUTO_TEST_SUITE(newRing_test);

BOOST_AUTO_TEST_CASE(gen)
{
    auto &&j = Ring::Inst().newRing();
    BOOST_TEST(j["q"] == "00000000000000000000000000ec4ba7");
    BOOST_TEST(j["g"] == "00000000000000000000000000000006");
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(genH_test);

BOOST_AUTO_TEST_CASE(genh)
{
    json j;
    j["q"] = "00000000000000000000000000ec4ba7";
    j["g"] = "00000000000000000000000000000006";
    j["publicKeys"] = {
        "0000000000000000000000000004d5f2", // privateKey = 0d123
        "00000000000000000000000000c76edd", // privateKey = 0d456
    };

    auto &&res = Ring::Inst().genH(j);
    BOOST_TEST(res["h"] == "000000000000000000000000005a0219");
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(verify_test);

BOOST_AUTO_TEST_CASE(ver_false)
{
    json j;
    j["q"] = "00000000000000000000000000ec4ba7";
    j["g"] = "00000000000000000000000000000006";
    j["h"] = "000000000000000000000000005a0219";
    j["publicKeys"] = {
        "0000000000000000000000000004d5f2", // privateKey = 0d123
        "00000000000000000000000000c76edd", // privateKey = 0d456
    };
    j["t"] = "000000000000000000000000007e2884";
    j["payload"] = "asdf qwer";
    j["s"] = {
        "0000000000000000000000000060a0ac",
        "0000000000000000000000000000029a",
    };
    j["c"] = {
        "000000000000000000000000014f6851",
        "000000000000000000000000000000e9",
    };

    auto res = Ring::Inst().verify(j);
    BOOST_TEST(res == false);
}

BOOST_AUTO_TEST_CASE(ver_true)
{
    json j;
    j["q"] = "00000000000000000000000000ec4ba7";
    j["g"] = "00000000000000000000000000000006";
    j["h"] = "000000000000000000000000005a0219";
    j["publicKeys"] = {
        "0000000000000000000000000004d5f2", // privateKey = 0d123
        "00000000000000000000000000c76edd", // privateKey = 0d456
    };
    j["t"] = "000000000000000000000000007e2884";
    j["payload"] = "asdfqwer";
    j["s"] = {
        "0000000000000000000000000060a0ac",
        "0000000000000000000000000000029a",
    };
    j["c"] = {
        "000000000000000000000000014f6851",
        "000000000000000000000000000000e9",
    };

    auto res = Ring::Inst().verify(j);
    BOOST_TEST(res == true);
}

BOOST_AUTO_TEST_CASE(ver_throwc)
{
    json j;
    j["q"] = "00000000000000000000000000ec4ba7";
    j["g"] = "00000000000000000000000000000006";
    j["h"] = "000000000000000000000000005a0219";
    j["publicKeys"] = {
        "0000000000000000000000000004d5f2", // privateKey = 0d123
        "00000000000000000000000000c76edd", // privateKey = 0d456
    };
    j["t"] = "000000000000000000000000007e2884";
    j["payload"] = "asdfqwer";
    j["s"] = {
        "0000000000000000000000000060a0ac",
        "0000000000000000000000000000029a",
    };
    j["c"] = {
        "000000000000000000000000014f6851",
        "000000000000000000000000000000e9",
        "000000000000000000000000014f6851",
    };

    BOOST_CHECK_THROW(Ring::Inst().verify(j), std::exception);
}

BOOST_AUTO_TEST_CASE(ver_throws)
{
    json j;
    j["q"] = "00000000000000000000000000ec4ba7";
    j["g"] = "00000000000000000000000000000006";
    j["h"] = "000000000000000000000000005a0219";
    j["publicKeys"] = {
        "0000000000000000000000000004d5f2", // privateKey = 0d123
        "00000000000000000000000000c76edd", // privateKey = 0d456
    };
    j["t"] = "000000000000000000000000007e2884";
    j["payload"] = "asdfqwer";
    j["s"] = {
        "0000000000000000000000000060a0ac",
        "0000000000000000000000000000029a",
        "0000000000000000000000000060a0ac",
    };
    j["c"] = {
        "000000000000000000000000014f6851",
        "000000000000000000000000000000e9",
    };

    BOOST_CHECK_THROW(Ring::Inst().verify(j), std::exception);
}

BOOST_AUTO_TEST_SUITE_END();
