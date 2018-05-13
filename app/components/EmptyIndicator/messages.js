import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    empty: {
      id: 'app.components.EmptyIndicator.empty',
      defaultMessage: 'Empty',
    },
  }),
};
