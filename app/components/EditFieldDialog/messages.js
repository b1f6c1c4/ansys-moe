import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    viewHeader: {
      id: 'app.components.EditFieldDialog.viewHeader',
      defaultMessage: 'View field',
    },
    createHeader: {
      id: 'app.components.EditFieldDialog.createHeader',
      defaultMessage: 'Create field',
    },
    editHeader: {
      id: 'app.components.EditFieldDialog.editHeader',
      defaultMessage: 'Edit field',
    },
    typeLabel: {
      id: 'app.components.EditFieldDialog.typeLabel',
      defaultMessage: 'Type',
    },
    promptLabel: {
      id: 'app.components.EditFieldDialog.promptLabel',
      defaultMessage: 'Prompt',
    },
    promptHelperText: {
      id: 'app.components.EditFieldDialog.promptHelperText',
      defaultMessage: 'The question.',
    },
    defaultLabel: {
      id: 'app.components.EditFieldDialog.defaultLabel',
      defaultMessage: 'Default value',
    },
    defaultHelperText: {
      id: 'app.components.EditFieldDialog.defaultHelperText',
      defaultMessage: 'Optional.',
    },
    enumLabel: {
      id: 'app.components.EditFieldDialog.enumLabel',
      defaultMessage: 'Options',
    },
    enumHelperText: {
      id: 'app.components.EditFieldDialog.enumHelperText',
      defaultMessage: 'Per line.',
    },
    close: {
      id: 'app.components.EditFieldDialog.close',
      defaultMessage: 'Close',
    },
    create: {
      id: 'app.components.EditFieldDialog.create',
      defaultMessage: 'Create',
    },
    save: {
      id: 'app.components.EditFieldDialog.save',
      defaultMessage: 'Save',
    },
  }),
};
