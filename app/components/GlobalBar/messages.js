import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.GlobalBar.header',
      defaultMessage: 'Ballot system',
    },
    profile: {
      id: 'app.components.GlobalBar.profile',
      defaultMessage: 'Home',
    },
    password: {
      id: 'app.components.GlobalBar.password',
      defaultMessage: 'Change Password',
    },
    logout: {
      id: 'app.components.GlobalBar.logout',
      defaultMessage: 'Logout',
    },
  }),
};
