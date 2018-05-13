import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import AuthRequired from 'components/AuthRequired';
import ChangePasswordPage from 'components/ChangePasswordPage';

import * as changePasswordContainerActions from './actions';
import sagas from './sagas';

export class ChangePasswordContainer extends React.PureComponent {
  render() {
    return (
      <AuthRequired hasCredential={this.props.hasCredential}>
        <ChangePasswordPage {...this.props} />
      </AuthRequired>
    );
  }
}

ChangePasswordContainer.propTypes = {
  hasCredential: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPassword: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onPassword: (param) => dispatch(changePasswordContainerActions.passwordRequest(param)),
  };
}

const mapStateToProps = createStructuredSelector({
  hasCredential: (state) => !!state.getIn(['globalContainer', 'credential']),
  isLoading: (state) => state.getIn(['changePasswordContainer', 'isLoading']),
});

export default compose(
  injectSaga({ key: 'changePasswordContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(ChangePasswordContainer);
