import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { injectIntl, intlShape } from 'react-intl';

import {
  withStyles,
  IconButton,
  Snackbar as RawSnackbar,
} from 'material-ui';
import { Close } from 'material-ui-icons';

import * as CHANGE_PASSWORD_CONTAINER from 'containers/ChangePasswordContainer/constants';
import * as CREATE_BALLOT_CONTAINER from 'containers/CreateBallotContainer/constants';
import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  close: {
    width: theme.spacing.unit * 4,
    height: theme.spacing.unit * 4,
  },
});

class Snackbar extends React.PureComponent {
  render() {
    const {
      intl,
      classes,
      message,
      isOpen,
      onHide,
    } = this.props;

    let content;
    if (message) {
      switch (message.type) {
        case SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION: {
          const { status, name } = message;
          switch (status) {
            case 'inviting':
              content = intl.formatMessage(messages.inviting, { name });
              break;
            case 'invited':
              content = intl.formatMessage(messages.invited, { name });
              break;
            case 'preVoting':
              content = intl.formatMessage(messages.preVoting, { name });
              break;
            case 'voting':
              content = intl.formatMessage(messages.voting, { name });
              break;
            case 'finished':
              content = intl.formatMessage(messages.finished, { name });
              break;
            default:
              break;
          }
          break;
        }
        case SUBSCRIPTION_CONTAINER.VOTER_REGISTERED_ACTION: {
          const { ballot, name } = message;
          content = intl.formatMessage(messages.voterRegistered, { ballot, name });
          break;
        }
        case CHANGE_PASSWORD_CONTAINER.PASSWORD_SUCCESS:
          content = intl.formatMessage(messages.changePassword);
          break;
        case CREATE_BALLOT_CONTAINER.CREATE_BALLOT_SUCCESS: {
          const name = _.get(message, 'result.createBallot.name');
          content = intl.formatMessage(messages.createBallot, { name });
          break;
        }
        default:
          break;
      }
    }

    return (
      <RawSnackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={isOpen && !!content}
        onClose={onHide}
        message={content}
        action={(
          <IconButton
            color="inherit"
            className={classes.close}
            onClick={onHide}
          >
            <Close />
          </IconButton>
        )}
      />
    );
  }
}

Snackbar.propTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  classes: PropTypes.object.isRequired,
  message: PropTypes.any,
  isOpen: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
};

export default compose(
  injectIntl,
  withStyles(styles),
)(Snackbar);
