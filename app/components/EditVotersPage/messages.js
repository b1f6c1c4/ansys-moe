import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.EditVotersPage.header',
      defaultMessage: 'Voters',
    },
    export: {
      id: 'app.components.EditVotersPage.export',
      defaultMessage: 'Export',
    },
  }),
};
