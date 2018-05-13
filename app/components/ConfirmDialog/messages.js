import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    cancel: {
      id: 'app.components.ConfirmDialog.cancel',
      defaultMessage: 'Cancel',
    },
    confirm: {
      id: 'app.components.ConfirmDialog.confirm',
      defaultMessage: 'Confirm',
    },
  }),
};
