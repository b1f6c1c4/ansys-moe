#pragma once
#include "common.h"

class Ring : public Logger
{
    LOGGABLE(Ring);
public:

    json newRing();

    json genH(const json &param);

    bool verify(const json &param);
};
