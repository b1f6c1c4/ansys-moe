#pragma once
#include "common.h"

class Moe : public Logger
{
    LOGGABLE(Moe);
public:

    json Execute(const json &command);
};
