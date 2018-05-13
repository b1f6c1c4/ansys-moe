import _ from 'lodash';
import base64js from 'base64-js';
import bigInt from 'big-integer';
import { sha3_512 as sha3 } from 'js-sha3';
import stringify from 'json-stable-stringify';
import { TextEncoder } from 'text-encoding';

const parse = (str) => bigInt(str, 16);
const toStr = (val) => val.toString(16).padStart(2048 / 4, '0');

const random = (q) => bigInt.randBetween(q.shiftRight(4), q);

const groupHashInt = async (param, buf) => {
  const { q, g } = param;
  const h2 = sha3(buf);
  const h0 = parse(h2);
  return g.modPow(h0, q);
};

const groupHash = async (param, ...vals) => {
  const str = vals.map(toStr).join('');
  return groupHashInt(param, Buffer.from(str, 'hex'));
};

export const generateKeyPair = async (progress, param) => {
  const q = parse(param.q);
  const g = parse(param.g);

  const x = random(q);
  const y = g.modPow(x, q);

  return {
    privateKey: toStr(x),
    publicKey: toStr(y),
  };
};

const toUtf8 = (str) => {
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'test') {
    return new TextEncoder('utf-8').encode(str);
  }
  return Buffer.from(str, 'utf-8');
};

export const signMessage = async (progress, payload, param) => {
  const q = parse(param.q);
  const qm1 = q.minus(bigInt.one);
  const g = parse(param.g);
  const h = parse(param.h);
  const x = parse(param.x);
  const n = param.ys.length;
  const ys = param.ys.map(parse);

  let progressId = 0;
  const totalProgress = (4 * n) + 5;
  const pg = () => {
    progressId += 1;
    if (progress) {
      progress(progressId / totalProgress);
    }
  };

  const y0 = g.modPow(x, q);
  pg();
  const k = ys.findIndex((y) => y.equals(y0));
  if (k === -1) {
    const e = new Error('No public key');
    e.codes = ['nopk'];
    throw e;
  }

  const hVerify = await groupHash({ q, g }, ...ys);
  if (!h.equals(hVerify)) {
    const e = new Error('Ring parameter incorrect');
    e.codes = ['rpic'];
    throw e;
  }

  const t = h.modPow(x, q);
  pg();
  const ss = Array.from({ length: n }, () => random(q));
  const cs = Array.from({ length: n }, () => random(q));
  const us = _.zip(ys, ss, cs).map(([y, s, c]) => {
    const temp = y.modPow(c, q);
    pg();
    const result = g.modPow(s, q).multiply(temp).mod(q);
    pg();
    return result;
  });
  const vs = _.zip(ss, cs).map(([s, c]) => {
    const temp = t.modPow(c, q);
    pg();
    const result = h.modPow(s, q).multiply(temp).mod(q);
    pg();
    return result;
  });
  us[k] = g.modPow(ss[k], q);
  pg();
  vs[k] = h.modPow(ss[k], q);
  pg();

  const pld = stringify(payload);
  const pldData = toUtf8(pld);
  const m = await groupHashInt({ q, g }, pldData);
  const h1 = await groupHash({ q, g }, m, t, ...us, ...vs);
  pg();
  const sum = _.reduce(cs, (sm, c) => sm.add(c)).mod(qm1);
  cs[k] = cs[k].add(h1).add(qm1).minus(sum).mod(qm1);
  ss[k] = ss[k].add(qm1).minus(cs[k].multiply(x).mod(qm1)).mod(qm1);

  const ticket = {
    t: toStr(t),
    payload,
    s: ss.map(toStr),
    c: cs.map(toStr),
  };
  return {
    ticket,
    base64: base64js.fromByteArray(toUtf8(JSON.stringify(ticket))),
  };
};
