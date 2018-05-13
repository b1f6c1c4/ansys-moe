import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.HomePage.header',
      defaultMessage: 'Control panel',
    },
    listBallots: {
      id: 'app.components.HomePage.listBallots',
      defaultMessage: 'List of ballots',
    },
    create: {
      id: 'app.components.HomePage.create',
      defaultMessage: 'Create',
    },
    bId: {
      id: 'app.components.HomePage.bId',
      defaultMessage: 'ID',
    },
    name: {
      id: 'app.components.HomePage.name',
      defaultMessage: 'Name',
    },
    status: {
      id: 'app.components.HomePage.status',
      defaultMessage: 'Status',
    },
  }),
};
