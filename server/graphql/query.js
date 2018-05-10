const _ = require('lodash');
const errors = require('./error');
const { Ballot } = require('../../models/ballots');
const { project } = require('./projection');
const throttle = require('./throttle');
const logger = require('../../logger')('graphql/query');

module.exports = {
  resolvers: {
    Query: {
      async ballot(parent, args, context, info) {
        logger.debug('Query.ballot', args);
        logger.trace('parent', parent);
        logger.trace('context', context);

        const { bId } = args.input;

        try {
          await throttle('ballot', 5, 2000)(bId);

          const proj = project(info);
          logger.debug('Project', proj);

          const doc = await Ballot.findById(bId, proj);
          if (!doc) {
            return new errors.NotFoundError();
          }
          const obj = doc.toObject();
          return obj;
        } catch (e) {
          if (e instanceof errors.TooManyRequestsError) return e;
          logger.error('Query ballot', e);
          return e;
        }
      },

      async ballots(parent, args, context, info) {
        logger.debug('Query.ballots', args);
        logger.trace('parent', parent);
        logger.trace('context', context);

        if (!_.get(context, 'auth.username')) {
          return new errors.UnauthorizedError();
        }

        const { username } = context.auth;

        try {
          await throttle('ballots', 1, 5000)(username);

          const proj = project(info);
          logger.debug('Project', proj);

          const docs = await Ballot.find({ owner: username }, proj);
          const objs = docs.map((d) => d.toObject());
          return objs;
        } catch (e) {
          if (e instanceof errors.TooManyRequestsError) return e;
          logger.error('Query ballots', e);
          return e;
        }
      },
    },

    Ballot: {
      fields(parent, args, context) {
        logger.debug('Ballot.fields', args);
        logger.trace('parent', parent);
        logger.trace('context', context);

        switch (parent.status) {
          case 'preVoting':
          case 'voting':
          case 'finished':
            break;
          default:
            if (parent.owner !== _.get(context, 'auth.username')) {
              return new errors.UnauthorizedError();
            }
            break;
        }

        return parent.fields;
      },

      voters(parent, args, context) {
        logger.debug('Ballot.voters', args);
        logger.trace('parent', parent);
        logger.trace('context', context);

        switch (parent.status) {
          case 'invited':
          case 'preVoting':
          case 'voting':
          case 'finished':
            break;
          default:
            if (parent.owner !== _.get(context, 'auth.username')) {
              return new errors.UnauthorizedError();
            }
            break;
        }

        return parent.voters;
      },
    },

    BallotField: {
      __resolveType(parent) {
        logger.debug('BallotField.__resolveType', parent);
        switch (parent.type) {
          case 'enum':
            return 'EnumField';
          case 'string':
            return 'StringField';
          default:
            return null;
        }
      },
    },
  },
};
