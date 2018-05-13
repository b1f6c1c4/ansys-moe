import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
} from 'material-ui';
import { Edit } from 'material-ui-icons';
import Button from 'components/Button';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
});

class EditButton extends React.PureComponent {
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
        <Edit className={classes.rightIcon} />
      </Button>
    );
  }
}

EditButton.propTypes = {
  onClick: PropTypes.func,
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
};

EditButton.defaultProps = {
  isLoading: false,
};

export default compose(
  withStyles(styles),
)(EditButton);
