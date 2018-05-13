import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    bId: {
      id: 'app.components.BallotMeta.bId',
      defaultMessage: 'ID: ',
    },
    owner: {
      id: 'app.components.BallotMeta.owner',
      defaultMessage: 'Owner: ',
    },
  }),
};
