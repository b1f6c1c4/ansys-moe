import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Typography,
} from 'material-ui';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
});

class NotFoundPage extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes } = this.props;

    return (
      <div>
        <Typography variant="display4">
          404
        </Typography>
        <Typography variant="display1">
          找不到页面
        </Typography>
      </div>
    );
  }
}

NotFoundPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default compose(
  withStyles(styles),
)(NotFoundPage);
