import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  CircularProgress,
} from 'material-ui';
import { green } from 'material-ui/colors';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  buttonWrapper: {
    margin: theme.spacing.unit,
    position: 'relative',
  },
  buttonProgress: {
    color: green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});

class LoadingButton extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes, isLoading, ...other } = this.props;

    return (
      <div className={classes.buttonWrapper}>
        {this.props.children}
        {isLoading && <CircularProgress size={24} className={classes.buttonProgress} />}
      </div>
    );
  }
}

LoadingButton.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired,
  isLoading: PropTypes.bool,
};

export default compose(
  withStyles(styles),
)(LoadingButton);
