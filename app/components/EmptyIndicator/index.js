import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
  Typography,
} from 'material-ui';
import Loading from 'components/Loading';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  empty: {
    textAlign: 'center',
  },
});

class EmptyIndicator extends React.PureComponent {
  render() {
    const {
      classes,
      isLoading,
      list,
      text,
    } = this.props;

    const txt = text || messages.empty;

    if (isLoading) {
      return (
        <Loading />
      );
    }

    if (list && list.length > 0) return null;

    return (
      <Typography variant="display1" className={classes.empty}>
        <FormattedMessage {...txt} />
      </Typography>
    );
  }
}

EmptyIndicator.propTypes = {
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  list: PropTypes.array,
  text: PropTypes.object,
};

export default compose(
  withStyles(styles),
)(EmptyIndicator);
