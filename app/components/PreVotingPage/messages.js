import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.PreVotingPage.header',
      defaultMessage: 'Pre Voting',
    },
    pvLabel: {
      id: 'app.components.PreVotingPage.pvLabel',
      defaultMessage: 'Private Key',
    },
    pvHelperText: {
      id: 'app.components.PreVotingPage.pvHelperText',
      defaultMessage: 'Paste your private key here.',
    },
    sign: {
      id: 'app.components.PreVotingPage.sign',
      defaultMessage: 'Sign',
    },
    ticket: {
      id: 'app.components.PreVotingPage.ticket',
      defaultMessage: 'Signed ticket',
    },
    signTitle: {
      id: 'app.components.PreVotingPage.signTitle',
      defaultMessage: 'Are you sure',
    },
    signDescription: {
      id: 'app.components.PreVotingPage.signDescription',
      defaultMessage: 'Sign?',
    },
  }),
};
