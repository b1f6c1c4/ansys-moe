import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Typography,
} from 'material-ui';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  resultWrapper: {
    textAlign: 'center',
  },
});

class ResultIndicator extends React.PureComponent {
  formatErrors = (error) => {
    if (!error) return null;

    return (
      <Typography color="error">
        {error.raw && error.raw.message}
        <br />
        {JSON.stringify(error)}
      </Typography>
    );
  }

  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes, error } = this.props;

    return (
      <div className={classes.resultWrapper}>
        {this.formatErrors(error)}
      </div>
    );
  }
}

ResultIndicator.propTypes = {
  classes: PropTypes.object.isRequired,
  error: PropTypes.object,
};

export default compose(
  withStyles(styles),
)(ResultIndicator);
