import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import ViewCatPage from 'components/ViewCatPage';

import * as globalContainerSelectors from 'containers/GlobalContainer/selectors';
import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as viewCatContainerSelectors from './selectors';
import * as viewCatContainerActions from './actions';
import sagas from './sagas';

export class ViewCatContainer extends React.PureComponent {
  render() {
    const {
      match,
      ...other
    } = this.props;

    return (
      <ViewCatPage
        proj={match.params.proj}
        cHash={match.params.cHash}
        {...other}
      />
    );
  }
}

ViewCatContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  listHash: PropTypes.object,
  listProj: PropTypes.object,
  error: PropTypes.object,
  onStop: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch, props) {
  const { proj, cHash } = props.match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(globalContainerActions.etcdRequest()),
    onStop: () => dispatch(viewCatContainerActions.stopRequest({ proj, cHash })),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['viewCatContainer', 'isLoading']),
  listHash: globalContainerSelectors.ListHash(),
  listProj: globalContainerSelectors.ListProj(),
  error: viewCatContainerSelectors.Error(),
});

export default compose(
  injectSaga({ key: 'viewCatContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(ViewCatContainer);
