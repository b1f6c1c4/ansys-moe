import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    unknown: {
      id: 'app.components.StatusBadge.unknown',
      defaultMessage: 'UNKNOWN',
    },
    creating: {
      id: 'app.components.StatusBadge.creating',
      defaultMessage: 'Creating',
    },
    inviting: {
      id: 'app.components.StatusBadge.inviting',
      defaultMessage: 'Inviting',
    },
    invited: {
      id: 'app.components.StatusBadge.invited',
      defaultMessage: 'Invited',
    },
    preVoting: {
      id: 'app.components.StatusBadge.preVoting',
      defaultMessage: 'PreVoting',
    },
    voting: {
      id: 'app.components.StatusBadge.voting',
      defaultMessage: 'Voting',
    },
    finished: {
      id: 'app.components.StatusBadge.finished',
      defaultMessage: 'Finished',
    },
  }),
};
