import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';

import UploadPage from 'components/UploadPage';

import * as uploadContainerSelectors from './selectors';
import * as uploadContainerActions from './actions';
import sagas from './sagas';

export class UploadContainer extends React.PureComponent {
  componentWillMount() {
    this.props.onList();
  }

  render() {
    return (
      <UploadPage {...this.props} />
    );
  }
}

UploadContainer.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  files: PropTypes.array,
  error: PropTypes.object,
  onList: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onList: () => dispatch(uploadContainerActions.listRequest()),
    onUpload: (...param) => dispatch(uploadContainerActions.uploadRequest(...param)),
  };
}

const mapStateToProps = createStructuredSelector({
  isLoading: (state) => state.getIn(['uploadContainer', 'isLoading']),
  files: uploadContainerSelectors.Files(),
  error: uploadContainerSelectors.Error(),
});

export default compose(
  injectSaga({ key: 'uploadContainer', saga: sagas }),
  connect(mapStateToProps, mapDispatchToProps),
)(UploadContainer);
