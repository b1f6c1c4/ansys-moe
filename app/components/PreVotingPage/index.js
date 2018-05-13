import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';

import {
  withStyles,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Typography,
} from 'material-ui';
import { Select } from 'redux-form-material-ui';
import { Field, reduxForm, propTypes } from 'redux-form/immutable';
import BallotMeta from 'components/BallotMeta';
import Button from 'components/Button';
import ClearButton from 'components/ClearButton';
import ConfirmDialog from 'components/ConfirmDialog';
import EmptyIndicator from 'components/EmptyIndicator';
import LoadingButton from 'components/LoadingButton';
import RefreshButton from 'components/RefreshButton';
import ResultIndicator from 'components/ResultIndicator';
import TextField from 'components/TextField';
import make, { required, hexChar } from 'utils/validation';

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
  formControl: {
    minWidth: 300,
  },
  secret: {
    display: 'block', // Fix for MS Edge
    fontFamily: 'monospace',
    wordWrap: 'break-word',
  },
});

class PreVotingPage extends React.PureComponent {
  state = {
    isOpenSign: false,
  };

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

  validate = make(
    this.props.intl,
    required(),
  );
  validatePrivateKey = make(
    this.props.intl,
    required(),
    hexChar(),
  );

  handleSign = (vals) => {
    const result = [];
    _.mapValues(vals.toJS(), (v, k) => {
      if (!/^[0-9]+$/.test(k)) return;
      result[parseInt(k, 10)] = v;
    });
    return this.props.onSign({
      result,
      privateKey: vals.get('privateKey'),
    });
  };

  render() {
    const {
      classes,
      bId,
      ballot,
      fields,
      error,
      reset,
      handleSubmit,
      isLoading,
      isSignLoading,
      ticket,
      progress,
    } = this.props;

    const makeField = (f, i) => {
      switch (f.type) {
        case 'StringField':
          return (
            <div key={f.key}>
              <TextField
                name={String(i)}
                disabled={isSignLoading || !!ticket}
                label={f.prompt}
                fullWidth
              />
            </div>
          );
        case 'EnumField':
          return (
            <div key={f.key}>
              <FormControl className={classes.formControl}>
                <InputLabel>
                  {f.prompt}
                </InputLabel>
                <Field
                  name={String(i)}
                  disabled={isSignLoading || !!ticket}
                  component={Select}
                  validate={this.validate}
                >
                  {f.items.map((c) => (
                    <MenuItem value={c}>{c}</MenuItem>
                  ))}
                </Field>
              </FormControl>
            </div>
          );
        default:
          return (
            <ResultIndicator error={{ codes: ['tpns'] }} />
          );
      }
    };

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
              isLoading={isLoading || isSignLoading}
              onClick={this.props.onRefresh}
            />
          </LoadingButton>
        </div>
        <ResultIndicator error={this.props.refreshError} />
        {!isLoading && (
          <Paper className={classes.root}>
            <form onSubmit={handleSubmit(this.handleConfirm('isOpenSign'))}>
              <Typography variant="title">
                <FormattedMessage {...messages.header} />
              </Typography>
              <EmptyIndicator
                isLoading={isLoading}
                list={ballot && fields}
              />
              {ballot && fields && fields.map(makeField)}
              <div>
                <TextField
                  name="privateKey"
                  label={messages.pvLabel}
                  helperText={messages.pvHelperText}
                  disabled={isSignLoading || !!ticket}
                  fullWidth
                  validate={this.validatePrivateKey}
                />
                <ResultIndicator {...{ error }} />
              </div>
              {!ticket && (
                <div className={classes.formActions}>
                  <ClearButton
                    reset={reset}
                    isLoading={isSignLoading}
                  />
                  <LoadingButton isLoading={isSignLoading}>
                    <Button
                      type="submit"
                      variant={this.props.pristine ? 'flat' : 'raised'}
                      color="primary"
                      disabled={isSignLoading}
                    >
                      <FormattedMessage {...messages.sign} />
                    </Button>
                  </LoadingButton>
                </div>
              )}
              {ticket && (
                <Typography component="p">
                  <FormattedMessage {...messages.ticket} />
                </Typography>
              )}
              {ticket && (
                <span className={classes.secret}>
                  {ticket.base64}
                </span>
              )}
            </form>
            {progress !== null && (
              <LinearProgress variant="determinate" value={progress * 100} />
            )}
            <ConfirmDialog
              title={messages.signTitle}
              description={messages.signDescription}
              isOpen={this.state.isOpenSign}
              onCancel={this.handleConfirm()}
              onAction={this.handleConfirm(this.handleSign)}
            />
          </Paper>
        )}
      </div>
    );
  }
}

PreVotingPage.propTypes = {
  ...propTypes,
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  classes: PropTypes.object.isRequired,
  onPush: PropTypes.func.isRequired,
  bId: PropTypes.string.isRequired,
  ballot: PropTypes.object,
  refreshError: PropTypes.object,
  error: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  isSignLoading: PropTypes.bool.isRequired,
  onSign: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  ticket: PropTypes.object,
  progress: PropTypes.number,
};

export default compose(
  reduxForm({ form: 'preVotingForm' }),
  injectIntl,
  withStyles(styles),
)(PreVotingPage);
