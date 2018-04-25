#include "ring.h"
#include "ringImpl.h"
#include <iostream>

RingData getRing(const json &param)
{
    RingData ring;
    ring.q = RingImpl::Inst().fromJson(param.at("q"));
    ring.g = RingImpl::Inst().fromJson(param.at("g"));
    return ring;
}

json Ring::newRing()
{
    logger->trace("Ring::newRing");
    auto &&ring = RingImpl::Inst().generate();

    logger->trace("Finalize");
    json j;
    j["q"] = RingImpl::Inst().toString(ring.q);
    j["g"] = RingImpl::Inst().toString(ring.g);
    return j;
}

template <typename T>
std::unique_ptr<T> makeBuffer(size_t size)
{
    return std::unique_ptr<T>(new typename std::remove_extent<T>::type[size]);
}

json Ring::genH(const json &param)
{
    logger->trace("Ring::genH");
    auto &&ring = MathRing{std::move(getRing(param))};

    auto &&pks = param.at("publicKeys");
    auto num = pks.size();
    logger->debug("PublicKey size: {}", num);
    auto &&rawBuffer = makeBuffer<byte>(WIDTH_BYTE * num);
    auto buffer = &*rawBuffer;
    auto cur = buffer;
    for (auto it = pks.begin(); it != pks.end(); ++it)
        cur += RingImpl::Inst().fillBuffer(RingImpl::Inst().fromJson(*it), cur);
    logger->trace("Calculate group hash");
    auto &&h = RingImpl::Inst().groupHash(buffer, WIDTH_BYTE * num, ring);

    logger->trace("Finalize");
    json j;
    j["h"] = RingImpl::Inst().toString(h);
    return j;
}

bool Ring::verify(const json &param)
{
    logger->trace("Ring::verify");
    auto &&ring = MathRing{std::move(getRing(param))};

    std::vector<Integer> y, s, c;

    auto &&pks = param.at("publicKeys");
    auto num = pks.size();
    logger->debug("PublicKey size: {}", num);
    y.reserve(num);
    for (auto it = pks.begin(); it != pks.end(); ++it)
        y.push_back(std::move(RingImpl::Inst().fromJson(*it)));

    logger->trace("Parse s");
    auto &&ss = param.at("s");
    if (num != ss.size())
    {
        logger->error("Param s size {}, should be {}", ss.size(), num);
        throw std::invalid_argument{"s"};
    }
    s.reserve(num);
    for (auto it = ss.begin(); it != ss.end(); ++it)
        s.push_back(std::move(RingImpl::Inst().fromJson(*it)));

    logger->trace("Parse c");
    auto &&cs = param.at("c");
    if (num != cs.size())
    {
        logger->error("Param s size {}, should be {}", ss.size(), num);
        throw std::invalid_argument{"s"};
    }
    c.reserve(num);
    for (auto it = cs.begin(); it != cs.end(); ++it)
        c.push_back(std::move(RingImpl::Inst().fromJson(*it)));

    logger->trace("Get payload");
    auto &&payload = param.at("payload").get<std::string>();
    logger->trace("Calculate group hash phase 1");
    auto &&m = RingImpl::Inst().groupHash(reinterpret_cast<const byte *>(payload.c_str()), payload.length(), ring);
    logger->trace("Parse h");
    auto &&h = RingImpl::Inst().fromJson(param.at("h"));
    logger->trace("Parse t");
    auto &&t = RingImpl::Inst().fromJson(param.at("t"));

    logger->trace("Calculate u, v");
    auto sum = Integer::Zero();
    auto &&rawBuffer = makeBuffer<byte>(WIDTH_BYTE * (2 + 2 * num));
    auto buffer = &*rawBuffer;
    RingImpl::Inst().fillBuffer(m, buffer);
    RingImpl::Inst().fillBuffer(t, buffer + WIDTH_BYTE);
    for (size_t i = 0; i < num; i++)
    {
        auto &&tmp1 = ring.maq.Exponentiate(ring.g, s[i]);
        auto &&tmp2 = ring.maq.Exponentiate(y[i], c[i]);
        auto &&u = ring.maq.Multiply(tmp1, tmp2);
        RingImpl::Inst().fillBuffer(u, buffer + WIDTH_BYTE * (2 + i));

        auto &&tmp3 = ring.maq.Exponentiate(h, s[i]);
        auto &&tmp4 = ring.maq.Exponentiate(t, c[i]);
        auto &&v = ring.maq.Multiply(tmp3, tmp4);
        RingImpl::Inst().fillBuffer(v, buffer + WIDTH_BYTE * (2 + num + i));

        sum = ring.maqm1.Add(sum, c[i]);
    }

    logger->trace("Calculate group hash phase 2");
    auto &&hx = RingImpl::Inst().groupHash(buffer, WIDTH_BYTE * (2 + 2 * num), ring);

    logger->trace("Finalize");
    return sum == hx;
}
