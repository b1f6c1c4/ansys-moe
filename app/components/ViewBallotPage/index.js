import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';
import * as Permission from 'utils/permission';

import {
  withStyles,
  Card,
  CardActions,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from 'material-ui';
import QRCode from 'qrcode.react';
import BallotMeta from 'components/BallotMeta';
import Button from 'components/Button';
import ConfirmDialog from 'components/ConfirmDialog';
import EditButton from 'components/EditButton';
import EmptyIndicator from 'components/EmptyIndicator';
import LoadingButton from 'components/LoadingButton';
import RefreshButton from 'components/RefreshButton';
import ResultIndicator from 'components/ResultIndicator';
import ViewButton from 'components/ViewButton';

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
    justifyContent: 'flex-start',
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  card: {
    margin: theme.spacing.unit,
    minWidth: 280,
    flexGrow: 1,
  },
  xcard: {
    margin: theme.spacing.unit,
    maxWidth: 300,
    flexGrow: 1,
  },
  count: {
    textAlign: 'center',
  },
  detail: {
    display: 'block', // Fix for MS Edge
    fontFamily: 'monospace',
    wordWrap: 'break-word',
  },
  qrcode: {
    textAlign: 'center',
  },
});

class ViewBallotPage extends React.PureComponent {
  state = {
    isOpenFinalizeVoters: false,
    isOpenFinalizeFields: false,
    isOpenFinalizePreVoting: false,
    isOpenFinalizeVoting: false,
  };

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.bId, this.props.bId)) {
      this.handleConfirm()();
    }
  }

  handleConfirm = (ac) => () => {
    if (_.isString(ac)) {
      this.setState(_.assign({}, this.state, { [ac]: true }));
      return;
    }
    if (_.isFunction(ac)) {
      ac();
    }
    this.setState(_.mapValues(this.state, (v, k) => /^isOpen/.test(k) ? false : v));
  };

  handleStatView = () => {
    const { bId } = this.props;
    this.props.onPush(`/app/ballots/${bId}/tickets/`);
  };

  render() {
    const {
      classes,
      bId,
      isLoading,
      ballot,
      count,
      isOperable,
    } = this.props;

    const canEditFields = ballot && isOperable && Permission.CanEditFields(ballot);
    const canEditVoters = ballot && isOperable && Permission.CanEditVoters(ballot);
    const canViewStats = !isLoading && ballot && Permission.CanViewStats(ballot);

    const makeFieldType = (b) => {
      const type = b.__typename; // eslint-disable-line no-underscore-dangle
      const key = `fieldType_${type}`;
      if (messages[key]) {
        return (
          <FormattedMessage {...messages[key]} />
        );
      }
      return (
        <span>{type}</span>
      );
    };

    const makeVoterReg = (b) => {
      if (b.publicKey) {
        return (
          <FormattedMessage {...messages.registered} />
        );
      }
      return (
        <FormattedMessage {...messages.unregistered} />
      );
    };

    const makeUrl = () => `${window.location.protocol}//${window.location.host}/app/ballots/${bId}/preVoting`;
    const makeVUrl = () => `${window.location.protocol}//${window.location.host}/secret/`;

    return (
      <div className={classes.container}>
        <BallotMeta
          {...{
            onPush: this.props.onPush,
            bId,
            ballot,
            isLoading,
            onRefresh: this.props.onRefresh,
          }}
        />
        <div className={classes.actions}>
          <LoadingButton {...{ isLoading }}>
            <RefreshButton
              isLoading={isLoading}
              onClick={this.props.onRefresh}
            />
          </LoadingButton>
          {!isLoading && ballot && ballot.status === 'inviting' && isOperable && (
            <Button
              color="secondary"
              onClick={this.handleConfirm('isOpenFinalizeVoters')}
            >
              <FormattedMessage {...messages.finalizeVoters} />
            </Button>
          )}
          <ConfirmDialog
            title={messages.finalizeVotersTitle}
            description={messages.finalizeVotersDescription}
            isOpen={this.state.isOpenFinalizeVoters}
            onCancel={this.handleConfirm()}
            onAction={this.handleConfirm(this.props.onFinalize)}
          />
          {!isLoading && ballot && ballot.status === 'invited' && isOperable && (
            <Button
              color="secondary"
              onClick={this.handleConfirm('isOpenFinalizeFields')}
            >
              <FormattedMessage {...messages.finalizeFields} />
            </Button>
          )}
          <ConfirmDialog
            title={messages.finalizeFieldsTitle}
            description={messages.finalizeFieldsDescription}
            isOpen={this.state.isOpenFinalizeFields}
            onCancel={this.handleConfirm()}
            onAction={this.handleConfirm(this.props.onFinalize)}
          />
          {!isLoading && ballot && ballot.status === 'preVoting' && isOperable && (
            <Button
              color="secondary"
              onClick={this.handleConfirm('isOpenFinalizePreVoting')}
            >
              <FormattedMessage {...messages.finalizePreVoting} />
            </Button>
          )}
          <ConfirmDialog
            title={messages.finalizePreVotingTitle}
            description={messages.finalizePreVotingDescription}
            isOpen={this.state.isOpenFinalizePreVoting}
            onCancel={this.handleConfirm()}
            onAction={this.handleConfirm(this.props.onFinalize)}
          />
          {!isLoading && ballot && ballot.status === 'voting' && isOperable && (
            <Button
              color="secondary"
              onClick={this.handleConfirm('isOpenFinalizeVoting')}
            >
              <FormattedMessage {...messages.finalizeVoting} />
            </Button>
          )}
          <ConfirmDialog
            title={messages.finalizeVotingTitle}
            description={messages.finalizeVotingDescription}
            isOpen={this.state.isOpenFinalizeVoting}
            onCancel={this.handleConfirm()}
            onAction={this.handleConfirm(this.props.onFinalize)}
          />
          {!isLoading && (
            <Button
              color="secondary"
              onClick={this.props.onExport}
            >
              <FormattedMessage {...messages.export} />
            </Button>
          )}
        </div>
        <ResultIndicator error={this.props.error} />
        <div className={classes.cards}>
          <Card className={classes.card}>
            <CardContent>
              <Typography variant="subheading">
                <FormattedMessage {...messages.fields} />
              </Typography>
              <EmptyIndicator isLoading={isLoading} list={ballot && ballot.fields} />
              {!isLoading && ballot && ballot.fields && (
                <Table>
                  <TableBody>
                    {ballot.fields.map((b) => (
                      <TableRow>
                        <TableCell>{b.prompt}</TableCell>
                        <TableCell>{makeFieldType(b)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardActions>
              {canEditFields && (
                <EditButton to={`/app/ballots/${bId}/fields/`} />
              )}
              {!canEditFields && (
                <ViewButton to={`/app/ballots/${bId}/fields/`} />
              )}
            </CardActions>
          </Card>
          <Card className={classes.card}>
            <CardContent>
              <Typography variant="subheading">
                <FormattedMessage {...messages.voters} />
              </Typography>
              <EmptyIndicator isLoading={isLoading} list={ballot && ballot.voters} />
              {!isLoading && ballot && ballot.voters && (
                <Table>
                  <TableBody>
                    {ballot.voters.map((b) => (
                      <TableRow>
                        <TableCell>{b.name}</TableCell>
                        <TableCell>{makeVoterReg(b)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardActions>
              {canEditVoters && (
                <EditButton to={`/app/ballots/${bId}/voters/`} />
              )}
              {!canEditVoters && (
                <ViewButton to={`/app/ballots/${bId}/voters/`} />
              )}
            </CardActions>
          </Card>
          {!isLoading && ballot && ballot.status === 'preVoting' && (
            <Card className={classes.xcard}>
              <CardContent>
                <Typography variant="subheading">
                  <FormattedMessage {...messages.preVoting} />
                </Typography>
                <Typography component="p">
                  <a href={makeUrl()}>
                    <span className={classes.detail}>{makeUrl()}</span>
                  </a>
                </Typography>
                <div className={classes.qrcode}>
                  <QRCode value={makeUrl()} size={256} />
                </div>
              </CardContent>
            </Card>
          )}
          {!isLoading && ballot && ballot.status === 'voting' && (
            <Card className={classes.xcard}>
              <CardContent>
                <Typography variant="subheading">
                  <FormattedMessage {...messages.voting} />
                </Typography>
                <Typography component="p">
                  <a href={makeVUrl()}>
                    <span className={classes.detail}>{makeVUrl()}</span>
                  </a>
                </Typography>
                <div className={classes.qrcode}>
                  <QRCode value={makeVUrl()} size={256} />
                </div>
              </CardContent>
            </Card>
          )}
          {canViewStats && (
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subheading">
                  <FormattedMessage {...messages.stats} />
                </Typography>
                <Typography variant="display1" className={classes.count}>
                  <FormattedMessage {...messages.count} />
                  &nbsp;
                  <span>{count}</span>
                </Typography>
              </CardContent>
              <CardActions>
                <ViewButton to={`/app/ballots/${bId}/tickets/`} />
              </CardActions>
            </Card>
          )}
        </div>
      </div>
    );
  }
}

ViewBallotPage.propTypes = {
  onPush: PropTypes.func.isRequired,
  bId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  ballot: PropTypes.object,
  error: PropTypes.object,
  count: PropTypes.number,
  isOperable: PropTypes.bool,
  isLoading: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onFinalize: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(ViewBallotPage);
