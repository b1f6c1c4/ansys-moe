import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.VoterRegPage.header',
      defaultMessage: 'Register as voter',
    },
    register: {
      id: 'app.components.VoterRegPage.register',
      defaultMessage: 'Register',
    },
    commentLabel: {
      id: 'app.components.VoterRegPage.commentLabel',
      defaultMessage: 'Comment',
    },
    commentHelperText: {
      id: 'app.components.VoterRegPage.commentHelperText',
      defaultMessage: 'Optional',
    },
    privateKey: {
      id: 'app.components.VoterRegPage.privateKey',
      defaultMessage: 'Private Key:',
    },
    registerTitle: {
      id: 'app.components.VoterRegPage.registerTitle',
      defaultMessage: 'Are you sure',
    },
    registerDescription: {
      id: 'app.components.VoterRegPage.registerDescription',
      defaultMessage: 'Register',
    },
  }),
};
