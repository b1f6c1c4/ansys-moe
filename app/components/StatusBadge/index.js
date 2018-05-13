import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
} from 'material-ui';
import classnames from 'classnames';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  major: {
    display: 'inline-block',
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingTop: theme.spacing.unit / 2,
    paddingBottom: theme.spacing.unit / 2,
    borderRadius: theme.spacing.unit / 2,
  },
  minor: {
    display: 'inline-block',
    fontSize: 12,
    marginLeft: theme.spacing.unit,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    borderRadius: theme.spacing.unit / 2,
  },
  unknown: {
    backgroundColor: '#3e2723',
    color: '#fff',
  },
  creating: {
    backgroundColor: '#cddc39',
    color: '#000',
  },
  inviting: {
    backgroundColor: '#ffc107',
    color: '#000',
  },
  invited: {
    backgroundColor: '#9C27B0',
    color: '#fff',
  },
  preVoting: {
    backgroundColor: '#2196F3',
    color: '#fff',
  },
  voting: {
    backgroundColor: '#ff5722',
    color: '#fff',
  },
  finished: {
    backgroundColor: '#607D8B',
    color: '#fff',
  },
});

class StatusBadge extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes, status, minor } = this.props;

    const cls = minor ? classes.minor : classes.major;

    if (!messages[status]) {
      return (
        <div className={classnames(cls, classes.unknown)}>
          <FormattedMessage {...messages.unknown} />
        </div>
      );
    }

    return (
      <div className={classnames(cls, classes[status])}>
        <FormattedMessage {...messages[status]} />
      </div>
    );
  }
}

StatusBadge.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.string,
  minor: PropTypes.bool,
};

StatusBadge.defaultProps = {
  minor: false,
};

export default compose(
  withStyles(styles),
)(StatusBadge);
