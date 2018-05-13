import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import GlobalPage from 'components/GlobalPage';

import * as languageProviderActions from 'containers/LanguageProvider/actions';
import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as globalContainerSelectors from './selectors';
import * as globalContainerActions from './actions';
import sagas from './sagas';

export class GlobalContainer extends React.PureComponent {
  componentWillMount() {
    this.props.onStatusesRequestAction();
  }

  componentWillUnmount() {
    this.props.onStatusesStopAction();
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
  isAccountOpen: PropTypes.bool.isRequired,
  onPush: PropTypes.func.isRequired,
  onLanguage: PropTypes.func.isRequired,
  username: PropTypes.string,
  listBallots: PropTypes.array,
  onOpenDrawerAction: PropTypes.func.isRequired,
  onCloseDrawerAction: PropTypes.func.isRequired,
  onOpenAccountAction: PropTypes.func.isRequired,
  onCloseAccountAction: PropTypes.func.isRequired,
  onLoginAction: PropTypes.func.isRequired,
  onLogoutAction: PropTypes.func.isRequired,
  onStatusesRequestAction: PropTypes.func.isRequired,
  onStatusesStopAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onPush: (url) => dispatch(push(url)),
    onLanguage: (lo) => dispatch(languageProviderActions.changeLocale(lo)),
    onOpenDrawerAction: () => dispatch(globalContainerActions.openDrawer()),
    onCloseDrawerAction: () => dispatch(globalContainerActions.closeDrawer()),
    onOpenAccountAction: () => dispatch(globalContainerActions.openAccount()),
    onCloseAccountAction: () => dispatch(globalContainerActions.closeAccount()),
    onLoginAction: () => dispatch(globalContainerActions.login()),
    onLogoutAction: () => dispatch(globalContainerActions.logout()),
    onStatusesRequestAction: () => dispatch(subscriptionContainerActions.statusesRequest()),
    onStatusesStopAction: () => dispatch(subscriptionContainerActions.statusesStop()),
  };
}

const mapStateToProps = createStructuredSelector({
  isDrawerOpen: (state) => state.getIn(['globalContainer', 'isDrawerOpen']),
  isAccountOpen: (state) => state.getIn(['globalContainer', 'isAccountOpen']),
  username: (state) => state.getIn(['globalContainer', 'credential', 'username']),
  listBallots: globalContainerSelectors.ListBallots(),
});

export default compose(
  injectSaga({ key: 'globalContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(GlobalContainer);
