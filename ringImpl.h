#pragma once
#include "common.h"
#include <cryptopp/integer.h>
#include <cryptopp/modarith.h>

#ifndef IS_TEST
extern size_t g_WIDTH_BIT;
#define WIDTH_BIT g_WIDTH_BIT
#else
#define WIDTH_BIT 128
#endif
#define WIDTH_BYTE (WIDTH_BIT / 8)
#define WIDTH_HEXCHAR (WIDTH_BIT / 4)

using namespace CryptoPP;

struct RingData
{
    Integer q;
    Integer g;
};

struct MathRing : public RingData
{
    ModularArithmetic maq;
    ModularArithmetic maqm1;

    MathRing(RingData &&ring);
    MathRing(const RingData &ring);
};

class RingImpl : public Logger
{
    LOGGABLE(RingImpl);
public:

    Integer fromJson(const json &j);

    std::string toString(const Integer &v);

    RingData generate();

    size_t fillBuffer(const Integer &v, byte *buffer);

    Integer readBuffer(const byte *buffer, size_t len);

    Integer groupHash(const byte *buffer, size_t len, const MathRing &ring);
};
