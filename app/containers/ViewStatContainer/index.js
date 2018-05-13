import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import ViewStatPage from 'components/ViewStatPage';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as viewStatContainerSelectors from './selectors';
import * as viewStatContainerActions from './actions';
import sagas from './sagas';

export class ViewStatContainer extends React.PureComponent {
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
      ...other
    } = this.props;

    return (
      <ViewStatPage
        bId={match.params.bId}
        {...other}
      />
    );
  }
}

ViewStatContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isStatsLoading: PropTypes.bool.isRequired,
  ballot: PropTypes.object,
  error: PropTypes.object,
  fieldIndex: PropTypes.number.isRequired,
  stat: PropTypes.array,
  onRefresh: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onChangeFieldAction: PropTypes.func.isRequired,
  onStatusRequestAction: PropTypes.func.isRequired,
  onStatusStopAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch, { match }) {
  const { bId } = match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(viewStatContainerActions.ballotRequest({ bId })),
    onExport: () => dispatch(viewStatContainerActions.exportRequest({ bId })),
    onChangeFieldAction: (index) => dispatch(viewStatContainerActions.changeField(index)),
    onStatusRequestAction: () => dispatch(viewStatContainerActions.statusRequest()),
    onStatusStopAction: () => dispatch(subscriptionContainerActions.statusStop()),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['viewStatContainer', 'isLoading']),
  isStatsLoading: (state) => state.getIn(['viewStatContainer', 'isStatsLoading']),
  fieldIndex: (state) => state.getIn(['viewStatContainer', 'fieldIndex']),
  ballot: viewStatContainerSelectors.Ballot(),
  error: viewStatContainerSelectors.Error(),
  stat: viewStatContainerSelectors.Stat(),
});

export default compose(
  injectSaga({ key: 'viewStatContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(ViewStatContainer);
