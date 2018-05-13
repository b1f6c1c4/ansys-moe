import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from 'material-ui';
import { Link } from 'react-router-dom';
import Abbreviation from 'components/Abbreviation';
import Button from 'components/Button';
import EmptyIndicator from 'components/EmptyIndicator';
import LoadingButton from 'components/LoadingButton';
import RefreshButton from 'components/RefreshButton';
import ResultIndicator from 'components/ResultIndicator';
import StatusBadge from 'components/StatusBadge';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  title: {
    margin: theme.spacing.unit,
    flex: 1,
  },
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
    justifyContent: 'flex-end',
  },
});

class HomePage extends React.PureComponent {
  handleClick = (bId) => () => this.props.onPush(`/app/ballots/${bId}`);

  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes, isLoading, listBallots } = this.props;

    return (
      <div className={classes.container}>
        <Typography variant="display2">
          <FormattedMessage {...messages.header} />
        </Typography>
        <Paper className={classes.root}>
          <div className={classes.actions}>
            <Typography variant="title" className={classes.title}>
              <FormattedMessage {...messages.listBallots} />
            </Typography>
            <LoadingButton {...{ isLoading }}>
              <RefreshButton
                isLoading={isLoading}
                onClick={this.props.onRefreshListBallots}
              />
            </LoadingButton>
          </div>
          <EmptyIndicator isLoading={isLoading} list={listBallots} />
          <ResultIndicator error={this.props.error} />
          {!isLoading && listBallots && listBallots.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="none"><FormattedMessage {...messages.bId} /></TableCell>
                  <TableCell padding="none"><FormattedMessage {...messages.name} /></TableCell>
                  <TableCell padding="none"><FormattedMessage {...messages.status} /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listBallots.map((b) => (
                  <TableRow key={b.bId} hover onClick={this.handleClick(b.bId)}>
                    <TableCell padding="none">
                      <Link to={`/app/ballots/${b.bId}`}>
                        <Abbreviation text={b.bId} />
                      </Link>
                    </TableCell>
                    <TableCell padding="none">
                      <Link to={`/app/ballots/${b.bId}`}>
                        {b.name}
                      </Link>
                    </TableCell>
                    <TableCell padding="none"><StatusBadge status={b.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className={classes.actions}>
            <LoadingButton>
              <Button
                color="secondary"
                variant="raised"
                to="/app/create"
              >
                <FormattedMessage {...messages.create} />
              </Button>
            </LoadingButton>
          </div>
        </Paper>
      </div>
    );
  }
}

HomePage.propTypes = {
  onPush: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  listBallots: PropTypes.array,
  error: PropTypes.object,
  onRefreshListBallots: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(HomePage);
