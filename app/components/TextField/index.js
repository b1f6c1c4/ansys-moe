import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { injectIntl, intlShape } from 'react-intl';

import {
  withStyles,
} from 'material-ui';
import { TextField as RawTextField } from 'redux-form-material-ui';
import { Field } from 'redux-form/immutable';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
});

class TextField extends React.PureComponent {
  render() {
    const {
      intl,
      type,
      label,
      helperText,
      ...other
    } = this.props;

    let lbl = label;
    if (_.isObject(label)) {
      lbl = intl.formatMessage(label);
    }

    return (
      <Field
        {...other}
        type={type || 'text'}
        component={RawTextField}
        margin="dense"
        label={lbl}
        helperText={helperText && intl.formatMessage(helperText)}
        fullWidth
      />
    );
  }
}

TextField.propTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  classes: PropTypes.object.isRequired,
  type: PropTypes.string,
  label: PropTypes.object.isRequired,
  helperText: PropTypes.object,
};

export default compose(
  injectIntl,
  withStyles(styles),
)(TextField);
