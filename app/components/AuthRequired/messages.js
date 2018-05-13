import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.AuthRequired.header',
      defaultMessage: 'Please login.',
    },
  }),
};
