import React from 'react';
import { compose } from 'redux';
import injectSaga from 'utils/injectSaga';

import sagas from './sagas';

// eslint-disable-next-line react/prefer-stateless-function
export class SubscriptionContainer extends React.PureComponent {
  render() {
    return null;
  }
}

export default compose(
  injectSaga({ key: 'subscriptionContainer', saga: sagas }),
)(SubscriptionContainer);
