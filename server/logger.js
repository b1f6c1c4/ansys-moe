const winston = require('winston');
const chalk = require('chalk');

const lvls = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: 'underline dim red',
    error: 'bold red',
    warn: 'bold yellow',
    info: 'dim green',
    debug: 'dim cyan',
    trace: 'dim cyan',
  },
};

winston.addColors(lvls);

const logger = winston.createLogger({
  level: process.env.BACKEND_LOG || (process.env.NODE_ENV === 'test' ? 'fatal' : 'info'),
  levels: lvls.levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
      const msg = chalk`{gray ${info.timestamp}} [${info.label}] ${info.level}: ${info.message}`;
      if (info.data === undefined) {
        return msg;
      }
      let data;
      if (info.data instanceof Error) {
        data = info.data.toString();
      } else {
        data = JSON.stringify(info.data, null, 2);
      }
      if (data.includes('\n')) {
        return `${msg}\n${data}`;
      }
      return `${msg} ${data}`;
    }),
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['fatal'],
    }),
  ],
});

module.exports = (lbl) => {
  const regularize = (k, f) => (msg, data) => {
    let message = msg;
    if (message === undefined) {
      message = 'undefined';
    }
    f({
      level: k,
      label: lbl || 'default',
      message,
      data,
    });
  };
  const customApi = {};
  Object.keys(lvls.levels).forEach((k) => {
    customApi[k] = regularize(k, (j) => logger.log(j));
  });
  customApi.fatalDie = regularize('fatal', (j) => {
    logger.log(j);
    logger.log({
      level: 'fatal',
      label: 'KERNEL',
      message: 'logger.fatalDie called, scheduing process.exit()',
    });
    setTimeout(() => process.exit(1), 1000);
  });
  return customApi;
};
