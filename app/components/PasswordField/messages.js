import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    label: {
      id: 'app.components.PasswordField.label',
      defaultMessage: 'Password',
    },
    helperText: {
      id: 'app.components.PasswordField.helperText',
      defaultMessage: '8+ chars.',
    },
  }),
};
