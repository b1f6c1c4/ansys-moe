#define BOOST_TEST_MODULE ringImpl
#include "common.test.h"

#include "../ringImpl.h"
#include <cryptopp/misc.h>
#include <cryptopp/osrng.h>
#include <cryptopp/nbtheory.h>

BOOST_AUTO_TEST_SUITE(MathRing_test);

BOOST_AUTO_TEST_CASE(moveRing)
{
    RingData ring;
    ring.q = Integer(123);
    ring.g = Integer(456);

    auto &&mr = MathRing{std::move(ring)};
    BOOST_TEST(mr.q == Integer(123));
    BOOST_TEST(mr.g == Integer(456));
    BOOST_TEST(mr.maq.GetModulus() == 123);
    BOOST_TEST(mr.maqm1.GetModulus() == 122);
}

BOOST_AUTO_TEST_CASE(copyRing)
{
    RingData ring;
    ring.q = Integer(123);
    ring.g = Integer(456);

    auto &&mr = MathRing{ring};
    BOOST_TEST(mr.q == Integer(123));
    BOOST_TEST(mr.g == Integer(456));
    BOOST_TEST(mr.maq.GetModulus() == 123);
    BOOST_TEST(mr.maqm1.GetModulus() == 122);
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(fromJson_test);

BOOST_AUTO_TEST_CASE(throws_no)
{
    json j;

    BOOST_CHECK_THROW(RingImpl::Inst().fromJson(j["key"]), std::invalid_argument);
}

BOOST_AUTO_TEST_CASE(throws_number)
{
    json j;
    j["key"] = 123;

    BOOST_CHECK_THROW(RingImpl::Inst().fromJson(j["key"]), std::invalid_argument);
}

BOOST_AUTO_TEST_CASE(throws_object)
{
    json j;
    j["key"]["val"] = "abcde";

    BOOST_CHECK_THROW(RingImpl::Inst().fromJson(j["key"]), std::invalid_argument);
}

BOOST_AUTO_TEST_CASE(throws_array)
{
    json j;
    j["key"] = { "abc" };

    BOOST_CHECK_THROW(RingImpl::Inst().fromJson(j["key"]), std::invalid_argument);
}

BOOST_AUTO_TEST_CASE(full)
{
    std::string str = "a012badf1494f3c358417e2a797765c2";
    auto &&hstr = str + "h";

    json j;
    j["key"] = str;

    auto &&i = RingImpl::Inst().fromJson(j["key"]);
    BOOST_TEST(i == Integer(hstr.c_str()));
}

BOOST_AUTO_TEST_CASE(partial)
{
    std::string str = "0000000000000a962620e95c1aa3bdbc";
    auto &&hstr = str + "h";

    json j;
    j["key"] = str;

    auto &&i = RingImpl::Inst().fromJson(j["key"]);
    BOOST_TEST(i == Integer(hstr.c_str()));
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(toString_test);

BOOST_AUTO_TEST_CASE(full)
{
    std::string str = "a012badf1494f3c358417e2a797765c2";
    auto &&hstr = str + "h";

    auto &&res = RingImpl::Inst().toString(Integer(hstr.c_str()));
    BOOST_TEST(res == str);
}

BOOST_AUTO_TEST_CASE(partial)
{
    std::string str = "0000000000000a962620e95c1aa3bdbc";
    auto &&hstr = str + "h";

    auto &&res = RingImpl::Inst().toString(Integer(hstr.c_str()));
    BOOST_TEST(res == str);
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(generate_test);

BOOST_AUTO_TEST_CASE(gen)
{
    auto &&ring = RingImpl::Inst().generate();

    auto half = Integer::One();
    half <<= WIDTH_BIT - 1;

    AutoSeededRandomPool prng;
    BOOST_TEST(VerifyPrime(prng, ring.q));
    BOOST_TEST(ring.q > half);
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(fillBuffer_test);

BOOST_AUTO_TEST_CASE(fill)
{
    std::string str = "0000000000000a962620e95c1aa3bdbch";
    Integer v(str.c_str());
    byte buffer[WIDTH_BYTE] = {0};

    auto res = RingImpl::Inst().fillBuffer(v, buffer);
    BOOST_TEST(res == WIDTH_BYTE);
    for (size_t i = 0; i < WIDTH_BYTE; i++)
    {
        byte b = std::stoi(str.substr(i * 2, 2), 0, 16);
        BOOST_TEST(buffer[i] == b);
    }
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(readBuffer_test);

BOOST_AUTO_TEST_CASE(read)
{
    std::string str = "0000000000000a962620e95c1aa3bdbch";
    byte buffer[WIDTH_BYTE] = {0};
    for (size_t i = 0; i < WIDTH_BYTE; i++)
        buffer[i] = std::stoi(str.substr(i * 2, 2), 0, 16);

    Integer v0(str.c_str());
    auto &&v = RingImpl::Inst().readBuffer(buffer, WIDTH_BYTE);
    BOOST_TEST(v == v0);
}

BOOST_AUTO_TEST_SUITE_END();

BOOST_AUTO_TEST_SUITE(groupHash_test);

BOOST_AUTO_TEST_CASE(hash)
{
    const byte buffer[] = "asdfqwer";
    RingData ring;
    ring.q = Integer(15485863);
    ring.g = Integer(6);

    auto &&res = RingImpl::Inst().groupHash(buffer, 8, ring);
    BOOST_TEST(res == Integer(7691388)); // 6^^$SHA3-512(buffer) % 15485863
}

BOOST_AUTO_TEST_SUITE_END();
