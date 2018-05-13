import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
  Paper,
  Typography,
} from 'material-ui';
import { reduxForm, propTypes } from 'redux-form/immutable';
import BallotMeta from 'components/BallotMeta';
import Button from 'components/Button';
import ClearButton from 'components/ClearButton';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingButton from 'components/LoadingButton';
import RefreshButton from 'components/RefreshButton';
import ResultIndicator from 'components/ResultIndicator';
import TextField from 'components/TextField';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  container: {
    width: '100%',
    padding: theme.spacing.unit,
  },
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    padding: theme.spacing.unit,
    overflowX: 'auto',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  formActions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  secret: {
    display: 'block', // Fix for MS Edge
    fontFamily: 'monospace',
    wordWrap: 'break-word',
  },
});

class VoterRegPage extends React.PureComponent {
  state = {
    isOpenRegister: false,
  };

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.bId, this.props.bId)) {
      this.handleConfirm()();
    }
  }

  handleConfirm = (ac) => (...args) => {
    if (_.isString(ac)) {
      this.setState(_.assign({}, this.state, { [ac]: true, args }));
      return;
    }
    if (_.isFunction(ac)) {
      ac(...this.state.args);
    }
    this.setState(_.mapValues(this.state, (v, k) => /^isOpen/.test(k) ? false : v));
  };

  handleRegister = (vals) => this.props.onRegister({
    comment: vals.get('comment'),
  });

  render() {
    const {
      classes,
      bId,
      ballot,
      error,
      reset,
      handleSubmit,
      isLoading,
      isRegLoading,
      privateKey,
    } = this.props;

    return (
      <div className={classes.container}>
        <BallotMeta
          header={messages.header}
          {...{
            onPush: this.props.onPush,
            bId,
            ballot,
            isLoading,
          }}
        />
        <div className={classes.actions}>
          <LoadingButton {...{ isLoading }}>
            <RefreshButton
              isLoading={isLoading || isRegLoading}
              onClick={this.props.onRefresh}
            />
          </LoadingButton>
        </div>
        <ResultIndicator error={this.props.refreshError} />
        {!isLoading && (
          <Paper className={classes.root}>
            <form onSubmit={handleSubmit(this.handleConfirm('isOpenRegister'))}>
              <Typography variant="title">
                <FormattedMessage {...messages.header} />
              </Typography>
              <div>
                <TextField
                  name="comment"
                  label={messages.commentLabel}
                  helperText={messages.commentHelperText}
                  disabled={isRegLoading || !!privateKey}
                  fullWidth
                />
                <ResultIndicator {...{ error }} />
              </div>
              {!privateKey && (
                <div className={classes.formActions}>
                  <ClearButton
                    reset={reset}
                    isLoading={isRegLoading}
                  />
                  <LoadingButton isLoading={isRegLoading}>
                    <Button
                      type="submit"
                      color="primary"
                      disabled={isRegLoading}
                    >
                      <FormattedMessage {...messages.register} />
                    </Button>
                  </LoadingButton>
                </div>
              )}
              {privateKey && (
                <Typography component="p">
                  <FormattedMessage {...messages.privateKey} />
                </Typography>
              )}
              {privateKey && (
                <span className={classes.secret}>{privateKey}</span>
              )}
            </form>
            <ConfirmDialog
              title={messages.registerTitle}
              description={messages.registerDescription}
              isOpen={this.state.isOpenRegister}
              onCancel={this.handleConfirm()}
              onAction={this.handleConfirm(this.handleRegister)}
            />
          </Paper>
        )}
      </div>
    );
  }
}

VoterRegPage.propTypes = {
  ...propTypes,
  classes: PropTypes.object.isRequired,
  onPush: PropTypes.func.isRequired,
  bId: PropTypes.string.isRequired,
  ballot: PropTypes.object,
  refreshError: PropTypes.object,
  error: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  isRegLoading: PropTypes.bool.isRequired,
  onRegister: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  privateKey: PropTypes.string,
};

export default compose(
  reduxForm({ form: 'voterRegForm' }),
  withStyles(styles),
)(VoterRegPage);
