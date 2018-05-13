import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    text: {
      id: 'app.components.RefreshButton.text',
      defaultMessage: 'Refresh',
    },
  }),
};
