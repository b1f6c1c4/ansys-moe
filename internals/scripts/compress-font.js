/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
const _ = require('lodash');
const { exec } = require('shelljs');
const fs = require('fs');
const async = require('async');
const path = require('path');
const readline = require('readline');
const fastXmlParser = require('fast-xml-parser');
const appResources = require('../../app/translations');
const indexResources = require('../../app/index/translations');

const theCodes = new Set();
let txt = _.values(appResources).concat(_.values(indexResources))
  .map((v) => _.values(v)).join('').replace(/[ -~]/g, '');
if (process.argv.length >= 3) {
  [, , txt] = process.argv;
} else {
  _.range(' '.charCodeAt(0), '~'.charCodeAt(0)).forEach((i) => {
    theCodes.add(i);
  });
}
_.range(txt.length).forEach((i) => {
  theCodes.add(txt.charCodeAt(i));
});

console.log(`${theCodes.size} codes`);
console.log([...theCodes].map((c) => String.fromCharCode(c)).join(''));

const extractNames = (iPath, codes) => new Promise((resolve) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(iPath),
  });

  const result = new Set();

  rl.on('line', (line) => {
    const m = line.match(/^\s*<map code="0x([0-9a-f]+)" name="cid([0-9]{5})"\/>/);
    if (!m) return;
    const code = parseInt(m[1], 16);
    if (!codes.has(code)) return;
    const name = parseInt(m[2], 16);
    result.add(name);
  });

  rl.on('close', () => {
    resolve(result);
  });
});

const filterNames = (iPath, oPath, names) => new Promise((resolve, reject) => {
  const outputFile = fs.createWriteStream(oPath);
  const rl = readline.createInterface({
    input: fs.createReadStream(iPath),
  });

  outputFile.on('err', reject);
  outputFile.on('close', resolve);

  const STATE = {
    NONE: 0,
    OPEN: 1,
  };
  let state = 0;
  let reg = null;

  rl.on('line', (line) => {
    switch (state) {
      case STATE.NONE: {
        let tag;
        if (line.includes('<GPOS>')) {
          tag = 'GPOS';
        } else if (line.includes('<GSUB>')) {
          tag = 'GSUB';
        } else if (line.includes('<VORG>')) {
          tag = 'VORG';
        } else {
          const m = line.match(/^(\s*)<([a-zA-Z]+) .*="cid([0-9]{5})"[^/]*(\/?)>/);
          if (!m) break;
          if (names.has(parseInt(m[3], 16))) break;
          if (m[4]) return;
          [, , tag] = m;
        }
        state = STATE.OPEN;
        reg = new RegExp(`</${tag}>$`);
        return;
      }
      case STATE.OPEN: {
        if (reg.test(line)) {
          state = STATE.NONE;
        }
        return;
      }
      default:
        reject(new Error('Wrong state'));
        return;
    }
    const ln = line.replace(/,cid([0-9]{5})/g, (match, name) => {
      if (names.has(parseInt(name, 16))) {
        return '';
      }
      return undefined;
    }).replace(/cid([0-9]{5}),/g, (match, name) => {
      if (names.has(parseInt(name, 16))) {
        return '';
      }
      return undefined;
    });
    outputFile.write(`${ln}\n`);
  });

  rl.on('close', () => {
    outputFile.end();
  });
});

const toXml = (ftmp) => new Promise((resolve, reject) => {
  fs.readFile(ftmp, 'utf-8', (err, xml) => {
    if (err) {
      reject(err);
      return;
    }

    const obj = fastXmlParser.parse(xml, {
      attributeNamePrefix: '_',
      attrNodeName: false,
      textNodeName: 'text',
      ignoreAttributes: false,
      ignoreNameSpace: true,
      allowBooleanAttributes: false,
      parseNodeValue: false,
      parseAttributeValue: false,
      trimValues: true,
      decodeHTMLchar: false,
      cdataTagName: false,
    });

    resolve(obj);
  });
});

const filterFd = (obj) => new Promise((resolve) => {
  const active = new Set();
  obj.ttFont.CFF.CFFFont.CharStrings.CharString.forEach((cs) => {
    const fd = parseInt(cs._fdSelectIndex, 10);
    active.add(fd);
  });

  const arr = [...active].sort((a, b) => a - b);
  obj.ttFont.CFF.CFFFont.CharStrings.CharString.forEach((cs) => {
    const fd = parseInt(cs._fdSelectIndex, 10);
    _.set(cs, '_fdSelectIndex', arr.indexOf(fd));
  });

  const p = 'ttFont.CFF.CFFFont.FDArray.FontDict';
  _.set(obj, p, arr.map((i) => _.set(_.get(obj, p)[i], '_index', arr.indexOf(i))));

  resolve(arr);
});

const filterSubrs = (obj, fdsRaw) => new Promise((resolve) => {
  const fds = fdsRaw.length;
  const subrs = _.times(fds, () => new Set());
  const gsubrs = new Set();

  const connect = (gen, set) => {
    for (const elem of gen) {
      set.add(elem);
    }
  };

  const makeBias = (a) => {
    if (!_.isArray(a)) return undefined;
    const n = a.length;
    if (n < 1240) {
      return 107;
    }
    if (n < 33900) {
      return 1131;
    }
    return 32768;
  };

  const biasGlobal = makeBias(obj.ttFont.CFF.GlobalSubrs.CharString);
  const biases = obj.ttFont.CFF.CFFFont.FDArray.FontDict.map((fdRaw) => makeBias(_.get(fdRaw, 'Private.Subrs.CharString')));

  // eslint-disable-next-line func-names
  const extractGlobal = function* (bias, cs) {
    const reg = /(-?[0-9]+) callgsubr/g;
    let match;
    // eslint-disable-next-line no-cond-assign
    while (match = reg.exec(cs.text)) {
      yield bias + parseInt(match[1], 10);
    }
  };

  // eslint-disable-next-line func-names
  const extract = function* (bias, cs) {
    const reg = /(-?[0-9]+) callsubr/g;
    let match;
    // eslint-disable-next-line no-cond-assign
    while (match = reg.exec(cs.text)) {
      yield bias + parseInt(match[1], 10);
    }
  };

  obj.ttFont.CFF.CFFFont.CharStrings.CharString.forEach((cs) => {
    const fd = cs._fdSelectIndex;
    connect(extractGlobal(biasGlobal, cs), gsubrs);
    connect(extract(biases[fd], cs), subrs[fd]);
  });

  obj.ttFont.CFF.CFFFont.FDArray.FontDict.forEach((fdRaw) => {
    if (!fdRaw.Private.Subrs) return;
    const fd = parseInt(fdRaw._index, 10);
    const active = subrs[fd];
    if (!active) return;
    const queue = [...active];
    const css = fdRaw.Private.Subrs.CharString;
    console.log(`Direct len of fd ${fdsRaw[fd]} is: ${active.size} / ${css.length}`);
    while (queue.length) {
      const id = queue.shift();
      connect(extractGlobal(biasGlobal, css[id]), gsubrs);
      for (const elem of extract(biases[fd], css[id])) {
        if (!active.has(elem)) {
          active.add(elem);
          queue.push(elem);
        }
      }
    }
    console.log(`Active len of fd ${fdsRaw[fd]} is: ${active.size} / ${css.length}`);
  });

  {
    const active = gsubrs;
    const queue = [...active];
    const css = obj.ttFont.CFF.GlobalSubrs.CharString;
    console.log(`Active len of global is: ${active.size} / ${css.length}`);
    while (queue.length) {
      const id = queue.shift();
      for (const elem of extractGlobal(biasGlobal, css[id])) {
        if (!active.has(elem)) {
          active.add(elem);
          queue.push(elem);
        }
      }
    }
    console.log(`Active len of global is: ${active.size} / ${css.length}`);
  }

  const arrGlobal = [...gsubrs].sort((a, b) => a - b);
  const arrs = subrs.map((subr) => [...subr].sort((a, b) => a - b));

  const newBiasGlobal = makeBias(arrGlobal);
  const newBiases = arrs.map((arr) => makeBias(arr));

  const gReplace = (t) => t.replace(/(-?[0-9]+) callgsubr/g, (match, id) => {
    const i = biasGlobal + parseInt(id, 10);
    const idx = arrGlobal.indexOf(i);
    if (idx === -1) {
      throw new Error(`Not found ${i} in global`);
    }
    return `${idx - newBiasGlobal} callgsubr`;
  });
  const lReplace = (fd) => (t) => t.replace(/(-?[0-9]+) callsubr/g, (match, id) => {
    const i = biases[fd] + parseInt(id, 10);
    const idx = arrs[fd].indexOf(i);
    if (idx === -1) {
      throw new Error(`Not found ${i} in ${fd}`);
    }
    return `${idx - newBiases[fd]} callsubr`;
  });

  {
    const p = 'ttFont.CFF.GlobalSubrs.CharString';
    _.set(obj, p, arrGlobal.map((i) => {
      const cs = _.get(obj, p)[i];
      _.set(cs, '_index', arrGlobal.indexOf(i));
      _.set(cs, 'text', gReplace(cs.text));
      return cs;
    }));
  }

  obj.ttFont.CFF.CFFFont.FDArray.FontDict.forEach((fdRaw, fd) => {
    const p = 'Private.Subrs.CharString';
    _.set(fdRaw, p, arrs[fd].map((i) => {
      const cs = _.get(fdRaw, p)[i];
      _.set(cs, '_index', arrs[fd].indexOf(i));
      _.set(cs, 'text', gReplace(cs.text));
      _.set(cs, 'text', lReplace(fd)(cs.text));
      return cs;
    }));
  });

  obj.ttFont.CFF.CFFFont.CharStrings.CharString.forEach((cs) => {
    const fd = cs._fdSelectIndex;
    _.set(cs, 'text', gReplace(cs.text));
    _.set(cs, 'text', lReplace(fd)(cs.text));
  });

  resolve();
});

const fromXml = (obj, ftmp) => new Promise((resolve, reject) => {
  // eslint-disable-next-line new-cap
  const parser = new fastXmlParser.j2xParser({
    attributeNamePrefix: '_',
    attrNodeName: false,
    textNodeName: 'text',
    ignoreAttributes: false,
    ignoreNameSpace: true,
    allowBooleanAttributes: false,
    parseNodeValue: false,
    parseAttributeValue: false,
    trimValues: true,
    decodeHTMLchar: false,
    cdataTagName: false,
    format: true,
    indentBy: '  ',
    supressEmptyNode: true,
  });

  const xml = parser.parse(obj);

  const head = '<?xml version="1.0" encoding="UTF-8"?>\n';

  fs.writeFile(ftmp, head + xml, 'utf-8', (err) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(obj);
  });
});

const ttx = (ftmp, fout) => new Promise((resolve, reject) => {
  exec(`ttx ${fout.endsWith('woff2') ? '--flavor woff2' : ''} -o ${fout} ${ftmp}`, {
    silent: true,
  }, (code, stdout, stderr) => {
    if (code) {
      console.log(stdout);
      console.error(stderr);
      reject(new Error(stderr));
    } else {
      resolve();
    }
  });
});

async.mapLimit([
  'Black',
  'Bold',
  'Medium',
  'Regular',
  'Light',
  'Thin',
], 3, async (s) => {
  const x = `NotoSansSC-${s}`;
  console.log(`Compressing ${x}`);
  const fin = path.join(__dirname, `../../app/resource/fonts/ttx/${x}.ttx`);
  const ftmp1 = path.join(__dirname, `../../app/resource/fonts/ttx/${x}-1.ttx`);
  const ftmp2 = path.join(__dirname, `../../app/resource/fonts/ttx/${x}-2.ttx`);
  const names = await extractNames(fin, theCodes);
  await filterNames(fin, ftmp1, names);
  const obj = await toXml(ftmp1);
  const fds = await filterFd(obj);
  await filterSubrs(obj, fds);
  await fromXml(obj, ftmp2);
  await Promise.all(['woff', 'woff2']
    .map((f) => ttx(ftmp2, path.join(__dirname, `../../app/resource/fonts/${x}-X.${f}`))));
}, (err) => {
  if (err) {
    console.error(err);
  }
});
