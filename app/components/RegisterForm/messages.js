import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.RegisterForm.header',
      defaultMessage: 'Sign up',
    },
    description: {
      id: 'app.components.RegisterForm.description',
      defaultMessage: 'Sign up here to use our service.',
    },
  }),
};
