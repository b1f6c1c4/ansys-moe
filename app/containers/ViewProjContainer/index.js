import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import ViewProjPage from 'components/ViewProjPage';
import * as globalContainerActions from 'containers/GlobalContainer/actions';
import * as globalContainerSelectors from 'containers/GlobalContainer/selectors';

import * as viewProjContainerSelectors from './selectors';
import * as viewProjContainerActions from './actions';
import sagas from './sagas';

export class ViewProjContainer extends React.PureComponent {
  render() {
    const {
      match,
      ...other
    } = this.props;

    return (
      <ViewProjPage
        proj={match.params.proj}
        {...other}
      />
    );
  }
}

ViewProjContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  listHash: PropTypes.object,
  listProj: PropTypes.object,
  error: PropTypes.object,
  onStop: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onEditAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch, props) {
  const { proj } = props.match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(globalContainerActions.etcdRequest()),
    onStop: () => dispatch(viewProjContainerActions.stopRequest({ proj })),
    onDrop: () => dispatch(viewProjContainerActions.dropRequest({ proj })),
    onEditAction: () => dispatch(viewProjContainerActions.edit({ proj })),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['viewProjContainer', 'isLoading']),
  listHash: globalContainerSelectors.ListHash(),
  listProj: globalContainerSelectors.ListProj(),
  error: viewProjContainerSelectors.Error(),
});

export default compose(
  injectSaga({ key: 'viewProjContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(ViewProjContainer);
