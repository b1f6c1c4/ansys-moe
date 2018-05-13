import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Typography,
} from 'material-ui';
import Loading from 'components/Loading';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  empty: {
    textAlign: 'center',
  },
});

class EmptyIndicator extends React.PureComponent {
  render() {
    const {
      classes,
      isLoading,
      list,
      text,
    } = this.props;

    if (isLoading) {
      return (
        <Loading />
      );
    }

    if (_.isArray(list) && list.length > 0) return null;
    if (_.isObject(list) && _.keys(list).length > 0) return null;

    return (
      <Typography variant="display1" className={classes.empty}>
        {text || '（空）'}
      </Typography>
    );
  }
}

EmptyIndicator.propTypes = {
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  list: PropTypes.any,
  text: PropTypes.object,
};

export default compose(
  withStyles(styles),
)(EmptyIndicator);
