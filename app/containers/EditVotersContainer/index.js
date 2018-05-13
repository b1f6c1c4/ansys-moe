import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import EditVotersPage from 'components/EditVotersPage';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as editVotersContainerSelectors from './selectors';
import * as editVotersContainerActions from './actions';
import sagas from './sagas';

export class EditVotersContainer extends React.PureComponent {
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
      ...other
    } = this.props;

    return (
      <EditVotersPage
        bId={match.params.bId}
        {...other}
      />
    );
  }
}

EditVotersContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isCreateLoading: PropTypes.bool.isRequired,
  ballot: PropTypes.object,
  error: PropTypes.object,
  voters: PropTypes.array,
  onRefresh: PropTypes.func.isRequired,
  onCreateVoter: PropTypes.func.isRequired,
  onDeleteVoter: PropTypes.func.isRequired,
  onStatusRequestAction: PropTypes.func.isRequired,
  onStatusStopAction: PropTypes.func.isRequired,
  onVoterRgRequestAction: PropTypes.func.isRequired,
  onVoterRgStopAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch, { match }) {
  const { bId } = match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(editVotersContainerActions.votersRequest({ bId })),
    onCreateVoter: ({ name }) => dispatch(editVotersContainerActions.createVoterRequest({ bId, name })),
    onDeleteVoter: ({ iCode }) => dispatch(editVotersContainerActions.deleteVoterRequest({ bId, iCode })),
    onStatusRequestAction: () => dispatch(editVotersContainerActions.statusRequest()),
    onStatusStopAction: () => dispatch(subscriptionContainerActions.statusStop()),
    onVoterRgRequestAction: () => dispatch(editVotersContainerActions.voterRgRequest()),
    onVoterRgStopAction: () => dispatch(subscriptionContainerActions.voterRgStop()),
  };
}

const mapStateToProps = createStructuredSelector({
  hasCredential: (state) => !!state.getIn(['globalContainer', 'credential']),
  isLoading: (state) => state.getIn(['editVotersContainer', 'isLoading']),
  isCreateLoading: (state) => state.getIn(['editVotersContainer', 'isCreateLoading']),
  ballot: editVotersContainerSelectors.Ballot(),
  error: editVotersContainerSelectors.Error(),
  voters: editVotersContainerSelectors.Voters(),
});

export default compose(
  injectSaga({ key: 'editVotersContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(EditVotersContainer);
