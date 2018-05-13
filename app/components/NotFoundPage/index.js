import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
  Typography,
} from 'material-ui';

import messages from './messages';

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
          <FormattedMessage {...messages.header} />
        </Typography>
        <Typography variant="display1">
          <FormattedMessage {...messages.description} />
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
