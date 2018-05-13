import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    text: {
      id: 'app.components.ViewButton.text',
      defaultMessage: 'View',
    },
  }),
};
