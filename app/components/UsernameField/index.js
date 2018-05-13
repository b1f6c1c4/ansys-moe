import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { injectIntl, intlShape } from 'react-intl';

import { withStyles } from 'material-ui';
import TextField from 'components/TextField';
import make, { required, alphanumericDash, minChar } from 'utils/validation';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
});

class UsernameField extends React.PureComponent {
  validate = make(
    this.props.intl,
    required(),
    alphanumericDash(),
    minChar(5),
  );

  render() {
    // eslint-disable-next-line no-unused-vars
    const { intl, classes, ...other } = this.props;

    return (
      <TextField
        {...other}
        label={messages.label}
        helperText={messages.helperText}
        validate={this.validate}
      />
    );
  }
}

UsernameField.propTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  classes: PropTypes.object.isRequired,
};

export default compose(
  injectIntl,
  withStyles(styles),
)(UsernameField);
