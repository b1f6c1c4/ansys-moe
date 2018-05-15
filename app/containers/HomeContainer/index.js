import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import HomePage from 'components/HomePage';
import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as globalContainerSelectors from 'containers/GlobalContainer/selectors';

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
  onPush: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  controller: PropTypes.bool.isRequired,
  rabbit: PropTypes.object,
  listProj: PropTypes.object,
  error: PropTypes.object,
  onStatus: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onCreateAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onPush: (url) => dispatch(push(url)),
    onStatus: () => {
      dispatch(homeContainerActions.statusRequest());
      dispatch(globalContainerActions.etcdRequest());
    },
    onStart: () => dispatch(homeContainerActions.startRequest()),
    onCreateAction: () => dispatch(homeContainerActions.create()),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['homeContainer', 'isLoading']),
  controller: (state) => state.getIn(['homeContainer', 'controller']),
  listProj: globalContainerSelectors.ListProj(),
  rabbit: homeContainerSelectors.Rabbit(),
  error: homeContainerSelectors.Error(),
});

export default compose(
  injectSaga({ key: 'homeContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(HomeContainer);
