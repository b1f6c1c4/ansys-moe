import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';

import AuthRequired from 'components/AuthRequired';
import HomePage from 'components/HomePage';

import * as globalContainerSelectors from 'containers/GlobalContainer/selectors';
import * as globalContainerActions from 'containers/GlobalContainer/actions';

export class HomeContainer extends React.PureComponent {
  render() {
    return (
      <AuthRequired hasCredential={this.props.hasCredential}>
        <HomePage {...this.props} />
      </AuthRequired>
    );
  }
}

HomeContainer.propTypes = {
  hasCredential: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  listBallots: PropTypes.array,
  error: PropTypes.object,
  onRefreshListBallots: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onPush: (url) => dispatch(push(url)),
    onRefreshListBallots: () => dispatch(globalContainerActions.ballotsRequest()),
  };
}

const mapStateToProps = createStructuredSelector({
  hasCredential: (state) => !!state.getIn(['globalContainer', 'credential']),
  isLoading: (state) => state.getIn(['globalContainer', 'isLoading']),
  listBallots: globalContainerSelectors.ListBallots(),
  error: globalContainerSelectors.Error(),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(HomeContainer);
