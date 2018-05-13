import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.LoginForm.header',
      defaultMessage: 'Sign in',
    },
    description: {
      id: 'app.components.LoginForm.description',
      defaultMessage: 'Sign in here to use our service.',
    },
  }),
};
