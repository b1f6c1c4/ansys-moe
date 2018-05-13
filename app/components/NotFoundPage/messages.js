import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.NotFoundPage.header',
      defaultMessage: '404 Not Found',
    },
    description: {
      id: 'app.components.NotFoundPage.description',
      defaultMessage: 'Please go back.',
    },
  }),
};
