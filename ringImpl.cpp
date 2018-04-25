#include "ringImpl.h"
#include <cryptopp/misc.h>
#include <cryptopp/osrng.h>
#include <cryptopp/nbtheory.h>
#include <cryptopp/sha3.h>

using namespace CryptoPP;

#ifndef IS_TEST
size_t g_WIDTH_BIT = 2048;
#endif

MathRing::MathRing(RingData &&ring) :
    RingData(std::move(ring)),
    maq(RingData::q),
    maqm1((Integer(RingData::q) -= Integer::One())) {}
MathRing::MathRing(const RingData &ring) :
    RingData(ring),
    maq(RingData::q),
    maqm1((Integer(RingData::q) -= Integer::One())) {}

Integer RingImpl::fromJson(const json &j)
{
    logger->trace("RingImpl::fromJson");
    if (!j.is_string())
    {
        logger->error("Not string: {}", j.dump());
        throw std::invalid_argument{"j"};
    }

    auto &&str = j.get<std::string>() + "h";
    logger->trace("Finalizing");
    return Integer(str.c_str());
}

std::string RingImpl::toString(const Integer &v)
{
    logger->trace("RingImpl::toString");
    auto &&str = IntToString(v, 16);
    auto length = str.length();

    if (length < WIDTH_HEXCHAR)
        str.insert(0, WIDTH_HEXCHAR - length, '0');

    logger->trace("Finalizing");
    return str;
}

#ifndef IS_TEST_RING
RingData RingImpl::generate()
{
    logger->trace("RingImpl::generate");
    AutoSeededRandomPool prng;
    PrimeAndGenerator pg;

    logger->info("Generating ring...");
    pg.Generate(1, prng, WIDTH_BIT + 1, WIDTH_BIT);
    logger->info("Generating ring done");

    logger->trace("Finalizing");
    RingData ring;
    ring.q = pg.SubPrime();
    ring.g = pg.Generator();
    return ring;
}
#endif

size_t RingImpl::fillBuffer(const Integer &v, byte *buffer)
{
    logger->trace("RingImpl::fillBuffer");
    v.Encode(buffer, WIDTH_BYTE);
    logger->trace("Finalizing");
    return WIDTH_BYTE;
}

Integer RingImpl::readBuffer(const byte *buffer, size_t len)
{
    logger->trace("RingImpl::readBuffer");
    Integer v;
    v.Decode(buffer, len);
    logger->trace("Finalizing");
    return v;
}

Integer RingImpl::groupHash(const byte *buffer, size_t len, const MathRing &ring)
{
    logger->trace("RingImpl::groupHash");
    SHA3_512 raw;

    byte digest[SHA3_512::DIGESTSIZE];
    raw.CalculateDigest(digest, buffer, len);

    logger->trace("Finalizing");
    auto &&hash = readBuffer(digest, SHA3_512::DIGESTSIZE);
    return ring.maq.Exponentiate(ring.g, hash);
}
