import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.CreateVoterForm.header',
      defaultMessage: 'Create Voter',
    },
    create: {
      id: 'app.components.CreateVoterPage.create',
      defaultMessage: 'Create',
    },
    nameLabel: {
      id: 'app.components.CreateVoterPage.nameLabel',
      defaultMessage: 'Name',
    },
    nameHelperText: {
      id: 'app.components.CreateVoterPage.nameHelperText',
      defaultMessage: 'Not null.',
    },
  }),
};
