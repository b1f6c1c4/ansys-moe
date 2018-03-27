const _ = require('lodash');
const mongoose = require('mongoose');
const logger = require('./logger')('mongo');

if (process.env.BACKEND_LOG === 'trace'
  || process.env.MONGOOSE_DEBUG) {
  logger.info('Mongoose debugging enabled');
  mongoose.set('debug', true);
}

const connectLocal = (dbName) => new Promise((resolve, reject) => {
  const host = process.env.MONGO_HOST || 'localhost';
  logger.debug('Mongo host', host);

  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connection open');
    resolve();
  });
  mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error', err);
  });
  mongoose.connection.on('disconnected', () => {
    logger.error('Mongoose connection disconnected');
  });
  mongoose.connection.on('reconnect', () => {
    logger.warn('Mongoose connection reconnected');
  });
  mongoose.connection.on('reconnectFailed', () => {
    logger.fatalDie('Mongoose connection reconnecting failed');
  });

  try {
    logger.info('Connecting mongo db...', dbName);
    mongoose.connect(`mongodb://${host}:27017/${dbName}`, {
      autoIndex: process.env.NODE_ENV !== 'production',
      autoReconnect: true,
      reconnectTries: 0,
      reconnectInterval: 100,
    }).then(resolve, reject);
  } catch (e) {
    logger.error('Calling mongoose.connect', e);
    reject(e);
  }
});

let isConnected = false;

const connect = async () => {
  if (isConnected) {
    logger.warn('Try connecting mongo mult times');
    return;
  }
  isConnected = true;

  if (process.env.NODE_ENV === 'test') {
    mongoose.set('bufferCommands', false);
    await connectLocal('ballot-test');
    return;
  }

  await connectLocal('ballot');
};

const fixUpdate = (schema) => {
  logger.info('Injecting hook for schema');

  // eslint-disable-next-line func-names
  schema.pre('findOneAndUpdate', function (next) {
    logger.trace('Fix query');
    if (this.options.upsert) {
      logger.trace('Removing $setOnInsert.__v');
      delete this._update.$setOnInsert.__v;
    }
    if (!_.get(this._update, '$inc.__v')) {
      logger.trace('Adding $inv.__v');
      _.set(this._update, '$inc.__v', 1);
    }
    next();
  });
};

module.exports = {
  connect,
  fixUpdate,
};
