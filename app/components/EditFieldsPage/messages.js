import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.EditFieldsPage.header',
      defaultMessage: 'Fields',
    },
    drop: {
      id: 'app.components.EditFieldsPage.drop',
      defaultMessage: 'Drop',
    },
    save: {
      id: 'app.components.EditFieldsPage.save',
      defaultMessage: 'Save',
    },
    dropTitle: {
      id: 'app.components.EditFieldsPage.dropTitle',
      defaultMessage: 'Are you sure',
    },
    dropDescription: {
      id: 'app.components.EditFieldsPage.dropDescription',
      defaultMessage: 'Drop?',
    },
    deleteTitle: {
      id: 'app.components.EditFieldsPage.deleteTitle',
      defaultMessage: 'Are you sure',
    },
    deleteDescription: {
      id: 'app.components.EditFieldsPage.deleteDescription',
      defaultMessage: 'Delete?',
    },
  }),
};
