import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
} from 'material-ui';
import { Visibility } from 'material-ui-icons';
import Button from 'components/Button';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
});

class ViewButton extends React.PureComponent {
  render() {
    const {
      classes,
      isLoading,
      ...other
    } = this.props;

    return (
      <Button
        {...other}
        color="primary"
        disabled={isLoading}
      >
        <FormattedMessage {...messages.text} />
        <Visibility className={classes.rightIcon} />
      </Button>
    );
  }
}

ViewButton.propTypes = {
  onClick: PropTypes.func,
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
};

export default compose(
  withStyles(styles),
)(ViewButton);
