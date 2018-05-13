import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    inviting: {
      id: 'app.components.Snackbar.inviting',
      defaultMessage: '{name} inviting',
    },
    invited: {
      id: 'app.components.Snackbar.invited',
      defaultMessage: '{name} invited',
    },
    preVoting: {
      id: 'app.components.Snackbar.preVoting',
      defaultMessage: '{name} preVoting',
    },
    voting: {
      id: 'app.components.Snackbar.voting',
      defaultMessage: '{name} voting',
    },
    finished: {
      id: 'app.components.Snackbar.finished',
      defaultMessage: '{name} finished',
    },
    voterRegistered: {
      id: 'app.components.Snackbar.voterRegistered',
      defaultMessage: '{ballot}.{name} registered',
    },
    changePassword: {
      id: 'app.components.Snackbar.changePassword',
      defaultMessage: 'Password changed',
    },
    createBallot: {
      id: 'app.components.Snackbar.createBallot',
      defaultMessage: '{name} created',
    },
  }),
};
