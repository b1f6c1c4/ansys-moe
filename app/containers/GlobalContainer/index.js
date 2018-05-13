import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import GlobalPage from 'components/GlobalPage';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as globalContainerSelectors from './selectors';
import * as globalContainerActions from './actions';
import sagas from './sagas';

export class GlobalContainer extends React.PureComponent {
  componentWillMount() {
    this.props.onEtcdRequestAction();
  }

  componentWillUnmount() {
    this.props.onEtcdStopAction();
  }

  render() {
    return (
      <GlobalPage {...this.props}>
        {this.props.children}
      </GlobalPage>
    );
  }
}

GlobalContainer.propTypes = {
  children: PropTypes.any,
  isDrawerOpen: PropTypes.bool.isRequired,
  onPush: PropTypes.func.isRequired,
  onOpenDrawerAction: PropTypes.func.isRequired,
  onCloseDrawerAction: PropTypes.func.isRequired,
  onEtcdRequestAction: PropTypes.func.isRequired,
  onEtcdStopAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onPush: (url) => dispatch(push(url)),
    onOpenDrawerAction: () => dispatch(globalContainerActions.openDrawer()),
    onCloseDrawerAction: () => dispatch(globalContainerActions.closeDrawer()),
    onEtcdRequestAction: () => dispatch(subscriptionContainerActions.etcdRequest()),
    onEtcdStopAction: () => dispatch(subscriptionContainerActions.etcdStop()),
  };
}

const mapStateToProps = createStructuredSelector({
  isDrawerOpen: (state) => state.getIn(['globalContainer', 'isDrawerOpen']),
});

export default compose(
  injectSaga({ key: 'globalContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(GlobalContainer);
