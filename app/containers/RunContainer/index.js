import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import RunPage from 'components/RunPage';
import * as runContainerSelectors from './selectors';
import * as runContainerActions from './actions';
import sagas from './sagas';

export class RunContainer extends React.PureComponent {
  render() {
    return (
      <RunPage {...this.props} />
    );
  }
}

RunContainer.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  onRun: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onRun: (param) => dispatch(runContainerActions.runRequest(param)),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['runContainer', 'isLoading']),
  error: runContainerSelectors.Error(),
});

export default compose(
  injectSaga({ key: 'runContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(RunContainer);
