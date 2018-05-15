import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import ViewEvalPage from 'components/ViewEvalPage';

import * as globalContainerSelectors from 'containers/GlobalContainer/selectors';
import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as viewEvalContainerSelectors from './selectors';
import * as viewEvalContainerActions from './actions';
import sagas from './sagas';

export class ViewEvalContainer extends React.PureComponent {
  render() {
    const {
      match,
      ...other
    } = this.props;

    return (
      <ViewEvalPage
        proj={match.params.proj}
        cHash={match.params.cHash}
        dHash={match.params.dHash}
        {...other}
      />
    );
  }
}

ViewEvalContainer.propTypes = {
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
  const { proj, cHash, dHash } = props.match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(globalContainerActions.etcdRequest()),
    onStop: () => dispatch(viewEvalContainerActions.stopRequest({ proj, cHash, dHash })),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['viewEvalContainer', 'isLoading']),
  listHash: globalContainerSelectors.ListHash(),
  listProj: globalContainerSelectors.ListProj(),
  error: viewEvalContainerSelectors.Error(),
});

export default compose(
  injectSaga({ key: 'viewEvalContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(ViewEvalContainer);
