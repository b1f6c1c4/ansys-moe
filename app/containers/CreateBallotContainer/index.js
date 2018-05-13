import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import AuthRequired from 'components/AuthRequired';
import CreateBallotPage from 'components/CreateBallotPage';

import * as createBallotContainerActions from './actions';
import sagas from './sagas';

export class CreateBallotContainer extends React.PureComponent {
  render() {
    return (
      <AuthRequired hasCredential={this.props.hasCredential}>
        <CreateBallotPage {...this.props} />
      </AuthRequired>
    );
  }
}

CreateBallotContainer.propTypes = {
  hasCredential: PropTypes.bool.isRequired,
  onCreate: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onCreate: (param) => dispatch(createBallotContainerActions.createBallotRequest(param)),
  };
}

const mapStateToProps = createStructuredSelector({
  hasCredential: (state) => !!state.getIn(['globalContainer', 'credential']),
  isLoading: (state) => state.getIn(['createBallotContainer', 'isLoading']),
});

export default compose(
  injectSaga({ key: 'createBallotContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(CreateBallotContainer);
