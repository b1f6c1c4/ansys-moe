import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    header: {
      id: 'app.components.ViewStatPage.header',
      defaultMessage: 'Statistics',
    },
    export: {
      id: 'app.components.ViewStatPage.export',
      defaultMessage: 'Export',
    },
    prev: {
      id: 'app.components.ViewStatPage.prev',
      defaultMessage: 'Prev',
    },
    next: {
      id: 'app.components.ViewStatPage.next',
      defaultMessage: 'Next',
    },
  }),
};
