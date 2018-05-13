import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.ChangePasswordPage.header',
      defaultMessage: 'Change password',
    },
    oldPassword: {
      id: 'app.components.ChangePasswordPage.oldPassword',
      defaultMessage: 'Old password',
    },
    newPassword: {
      id: 'app.components.ChangePasswordPage.newPassword',
      defaultMessage: 'New password',
    },
    change: {
      id: 'app.components.ChangePasswordPage.change',
      defaultMessage: 'Change',
    },
  }),
};
