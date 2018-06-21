/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
const { createServer } = require('http');
const express = require('express');
const cors = require('cors');
const status = require('./status');
const file = require('./file');
const logger = require('./logger')('index');

logger.info('Versions', process.versions);

process.on('unhandledRejection', (e) => {
  logger.fatal('Unhandled rejection', e);
  throw e;
});

process.on('uncaughtException', (e) => {
  logger.fatalDie('Uncaught exception', e);
});

process.on('warning', (e) => {
  logger.warn('Node warning', e);
});

process.on('SIGINT', () => {
  logger.fatalDie('SIGINT received');
});

process.on('SIGTERM', () => {
  logger.fatalDie('SIGTERM received');
});

const port = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.set('trust proxy', true);

app.use(cors({
  origin: [
    process.env.CORS_ORIGIN,
    /^https?:\/\/localhost(:\d+)?$/,
  ],
  methods: ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 300000,
}));

app.use((req, res, next) => {
  if (status) {
    res.set('X-Version', status.version);
    res.set('X-CommitHash', status.commitHash);
  }
  next();
});

app.use('/', file);

app.use('/', (req, res) => res.status(404).send());

function runApp() {
  logger.debug('http.createServer ...');
  const server = createServer(app);
  server.listen(port, (err) => {
    if (err) {
      logger.fatalDie(err);
      return;
    }

    logger.info(`Server started localhost:${port}`);
  });
}

const inits = [];

Promise.all(inits)
  .then(runApp)
  .catch((e) => {
    logger.fatalDie('Init failed', e);
  });
