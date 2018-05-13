import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import PreVotingPage from 'components/PreVotingPage';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as preVotingContainerSelectors from './selectors';
import * as preVotingContainerActions from './actions';
import sagas from './sagas';

export class PreVotingContainer extends React.PureComponent {
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
      <PreVotingPage
        bId={match.params.bId}
        refreshError={error}
        {...other}
      />
    );
  }
}

PreVotingContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  ballot: PropTypes.object,
  error: PropTypes.object,
  fields: PropTypes.array,
  ticket: PropTypes.object,
  progress: PropTypes.number,
  isLoading: PropTypes.bool.isRequired,
  isSignLoading: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onSign: PropTypes.func.isRequired,
  onStatusRequestAction: PropTypes.func.isRequired,
  onStatusStopAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch, { match }) {
  const { bId } = match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(preVotingContainerActions.refreshRequest({ bId })),
    onSign: ({ result, privateKey }) => dispatch(preVotingContainerActions.signRequest({
      payload: { bId, result },
      privateKey,
    })),
    onStatusRequestAction: () => dispatch(preVotingContainerActions.statusRequest()),
    onStatusStopAction: () => dispatch(subscriptionContainerActions.statusStop()),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['preVotingContainer', 'isLoading']),
  isSignLoading: (state) => state.getIn(['preVotingContainer', 'isSignLoading']),
  progress: (state) => state.getIn(['preVotingContainer', 'progress']),
  ballot: preVotingContainerSelectors.Ballot(),
  error: preVotingContainerSelectors.Error(),
  fields: preVotingContainerSelectors.Fields(),
  ticket: preVotingContainerSelectors.Ticket(),
});

export default compose(
  injectSaga({ key: 'preVotingContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(PreVotingContainer);
