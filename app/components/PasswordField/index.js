import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { injectIntl, intlShape } from 'react-intl';

import { withStyles } from 'material-ui';
import TextField from 'components/TextField';
import make, { required, minChar } from 'utils/validation';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  forceFont: {
    fontFamily: 'sans-serif',
  },
});

class PasswordField extends React.PureComponent {
  validate = make(
    this.props.intl,
    required(),
    minChar(8),
  );

  render() {
    // eslint-disable-next-line no-unused-vars
    const { intl, classes, isNew, ...other } = this.props;

    return (
      <TextField
        {...other}
        inputProps={{
          className: classes.forceFont,
          autoComplete: isNew ? 'new-password' : 'current-password',
        }}
        type="password"
        label={this.props.label || messages.label}
        helperText={messages.helperText}
        validate={this.validate}
      />
    );
  }
}

PasswordField.propTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  classes: PropTypes.object.isRequired,
  label: PropTypes.object,
  isNew: PropTypes.bool,
};

export default compose(
  injectIntl,
  withStyles(styles),
)(PasswordField);
