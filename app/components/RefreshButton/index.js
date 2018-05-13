import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
} from 'material-ui';
import { Refresh } from 'material-ui-icons';
import Button from 'components/Button';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
});

class RefreshButton extends React.PureComponent {
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
        <Refresh className={classes.rightIcon} />
      </Button>
    );
  }
}

RefreshButton.propTypes = {
  onClick: PropTypes.func,
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default compose(
  withStyles(styles),
)(RefreshButton);
