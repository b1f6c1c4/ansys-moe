import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import Snackbar from 'components/Snackbar';

import * as snackbarContainerSelectors from './selectors';
import * as snackbarContainerActions from './actions';
import sagas from './sagas';

export class SnackbarContainer extends React.PureComponent {
  render() {
    return (
      <Snackbar {...this.props} />
    );
  }
}

SnackbarContainer.propTypes = {
  message: PropTypes.any,
  isOpen: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onHide: (param) => dispatch(snackbarContainerActions.snackbarHide(param)),
  };
}

const mapStateToProps = createStructuredSelector({
  isOpen: (state) => state.getIn(['snackbarContainer', 'isOpen']),
  message: snackbarContainerSelectors.Message(),
});

export default compose(
  injectSaga({ key: 'snackbarContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(SnackbarContainer);
