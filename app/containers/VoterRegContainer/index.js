import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import VoterRegPage from 'components/VoterRegPage';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as voterRegContainerSelectors from './selectors';
import * as voterRegContainerActions from './actions';
import sagas from './sagas';

export class VoterRegContainer extends React.PureComponent {
  componentWillMount() {
    if (this.props.match.params.bId !== _.get(this.props.ballot, 'bId')) {
      this.props.onRefresh();
    }
  }

  componentDidMount() {
    if (this.props.match.params.bId === _.get(this.props.ballot, 'bId')) {
      this.props.onStatusRequestAction();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.match.params, this.props.match.params)) {
      this.props.onStatusStopAction();
      nextProps.onRefresh();
    }
  }

  componentWillUnmount() {
    this.props.onStatusStopAction();
  }

  render() {
    const {
      match,
      error,
      ...other
    } = this.props;

    return (
      <VoterRegPage
        bId={match.params.bId}
        refreshError={error}
        {...other}
      />
    );
  }
}

VoterRegContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  ballot: PropTypes.object,
  error: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  isRegLoading: PropTypes.bool.isRequired,
  onRegister: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  privateKey: PropTypes.string,
  onStatusRequestAction: PropTypes.func.isRequired,
  onStatusStopAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch, { match }) {
  const { bId, iCode } = match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(voterRegContainerActions.refreshRequest({ bId })),
    onRegister: (param) => dispatch(voterRegContainerActions.registerRequest({
      bId,
      iCode,
      ...param,
    })),
    onStatusRequestAction: () => dispatch(voterRegContainerActions.statusRequest()),
    onStatusStopAction: () => dispatch(subscriptionContainerActions.statusStop()),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['voterRegContainer', 'isLoading']),
  isRegLoading: (state) => state.getIn(['voterRegContainer', 'isRegLoading']),
  ballot: voterRegContainerSelectors.Ballot(),
  error: voterRegContainerSelectors.Error(),
  privateKey: (state) => state.getIn(['voterRegContainer', 'privateKey']),
});

export default compose(
  injectSaga({ key: 'voterRegContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(VoterRegContainer);
