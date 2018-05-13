import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';
import * as Permission from 'utils/permission';

import {
  withStyles,
} from 'material-ui';
import downloadCsv from 'download-csv';
import BallotMeta from 'components/BallotMeta';
import Button from 'components/Button';
import CreateVoterForm from 'components/CreateVoterForm';
import EmptyIndicator from 'components/EmptyIndicator';
import LoadingButton from 'components/LoadingButton';
import RefreshButton from 'components/RefreshButton';
import ResultIndicator from 'components/ResultIndicator';
import VoterCard from 'components/VoterCard';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  container: {
    width: '100%',
    padding: theme.spacing.unit,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
});

class EditVotersPage extends React.PureComponent {
  handleDelete = (iCode) => () => this.props.onDeleteVoter({ iCode });

  handleExport = () => {
    downloadCsv(
      this.props.voters.map((v) => {
        const obj = _.omit(v, '__typename');
        if (v.publicKey) {
          obj.link = undefined;
        } else {
          obj.link = `${window.location.protocol}//${window.location.host}/app/vreg/${this.props.bId}/${v.iCode}`;
        }
        return obj;
      }),
      null,
      'voters.csv',
    );
  };

  render() {
    const {
      classes,
      bId,
      isLoading,
      ballot,
      voters,
    } = this.props;

    const canEditVoters = ballot && Permission.CanEditVoters(ballot);

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
              isLoading={isLoading}
              onClick={this.props.onRefresh}
            />
          </LoadingButton>
          {!isLoading && (
            <Button
              color="secondary"
              onClick={this.handleExport}
            >
              <FormattedMessage {...messages.export} />
            </Button>
          )}
        </div>
        {!isLoading && canEditVoters && (
          <CreateVoterForm
            isLoading={this.props.isCreateLoading}
            onCreateVoter={this.props.onCreateVoter}
          />
        )}
        <ResultIndicator error={this.props.error} />
        <EmptyIndicator isLoading={isLoading} list={ballot && voters} />
        <div className={classes.cards}>
          {!isLoading && voters && voters.map((v) => (
            <VoterCard
              key={v.iCode}
              voter={v}
              disabled={!canEditVoters}
              onDelete={this.handleDelete(v.iCode)}
              {...{ bId }}
            />
          ))}
        </div>
      </div>
    );
  }
}

EditVotersPage.propTypes = {
  onPush: PropTypes.func.isRequired,
  bId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  ballot: PropTypes.object,
  voters: PropTypes.array,
  error: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  isCreateLoading: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onCreateVoter: PropTypes.func.isRequired,
  onDeleteVoter: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(EditVotersPage);
