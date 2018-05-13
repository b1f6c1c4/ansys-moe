import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import ViewBallotPage from 'components/ViewBallotPage';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as viewBallotContainerSelectors from './selectors';
import * as viewBallotContainerActions from './actions';
import sagas from './sagas';

export class ViewBallotContainer extends React.PureComponent {
  componentWillMount() {
    if (this.props.match.params.bId !== _.get(this.props.ballot, 'bId')) {
      this.props.onRefresh();
    }
  }

  componentDidMount() {
    if (this.props.match.params.bId === _.get(this.props.ballot, 'bId')) {
      this.props.onStatusRequestAction();
      this.props.onVoterRgRequestAction();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.match.params, this.props.match.params)) {
      this.props.onStatusStopAction();
      this.props.onVoterRgStopAction();
      nextProps.onRefresh();
    }
  }

  componentWillUnmount() {
    this.props.onStatusStopAction();
    this.props.onVoterRgStopAction();
  }

  render() {
    const {
      match,
      ballot,
      ...other
    } = this.props;

    return (
      <ViewBallotPage
        bId={match.params.bId}
        ballot={ballot}
        {...other}
      />
    );
  }
}

ViewBallotContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  ballot: PropTypes.object,
  error: PropTypes.object,
  count: PropTypes.number,
  isOperable: PropTypes.bool,
  isLoading: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onFinalize: PropTypes.func.isRequired,
  onStatusRequestAction: PropTypes.func.isRequired,
  onStatusStopAction: PropTypes.func.isRequired,
  onVoterRgRequestAction: PropTypes.func.isRequired,
  onVoterRgStopAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch, { match }) {
  const { bId } = match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(viewBallotContainerActions.ballotRequest({ bId })),
    onExport: () => dispatch(viewBallotContainerActions.exportRequest({ bId })),
    onFinalize: () => dispatch(viewBallotContainerActions.finalizeRequest({ bId })),
    onStatusRequestAction: () => dispatch(viewBallotContainerActions.statusRequest()),
    onStatusStopAction: () => dispatch(subscriptionContainerActions.statusStop()),
    onVoterRgRequestAction: () => dispatch(viewBallotContainerActions.voterRgRequest()),
    onVoterRgStopAction: () => dispatch(subscriptionContainerActions.voterRgStop()),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['viewBallotContainer', 'isLoading']),
  ballot: viewBallotContainerSelectors.Ballot(),
  error: viewBallotContainerSelectors.Error(),
  count: (state) => state.getIn(['viewBallotContainer', 'count']),
  isOperable: (state) => {
    if (!state.getIn(['globalContainer', 'credential'])) {
      return false;
    }
    const me = state.getIn(['globalContainer', 'credential', 'username']);
    const ow = state.getIn(['viewBallotContainer', 'ballot', 'owner']);
    return me === ow;
  },
});

export default compose(
  injectSaga({ key: 'viewBallotContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(ViewBallotContainer);
