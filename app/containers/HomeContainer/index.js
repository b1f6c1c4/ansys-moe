import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import HomePage from 'components/HomePage';

import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as homeContainerSelectors from './selectors';
import * as homeContainerActions from './actions';
import sagas from './sagas';

export class HomeContainer extends React.PureComponent {
  componentWillMount() {
    this.props.onStatus();
  }

  render() {
    return (
      <HomePage {...this.props} />
    );
  }
}

HomeContainer.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  controller: PropTypes.bool.isRequired,
  rabbit: PropTypes.object,
  error: PropTypes.object,
  onStatus: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onStatus: () => {
      dispatch(homeContainerActions.statusRequest());
      dispatch(globalContainerActions.etcdRequest());
    },
    onStart: () => dispatch(homeContainerActions.startRequest()),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['homeContainer', 'isLoading']),
  controller: (state) => state.getIn(['homeContainer', 'controller']),
  error: homeContainerSelectors.Error(),
  rabbit: homeContainerSelectors.Rabbit(),
});

export default compose(
  injectSaga({ key: 'homeContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(HomeContainer);
