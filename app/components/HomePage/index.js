import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

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
import DocumentTitle from 'components/DocumentTitle';
import Button from 'components/Button';
import EmptyIndicator from 'components/EmptyIndicator';
import LoadingButton from 'components/LoadingButton';
import RefreshButton from 'components/RefreshButton';
import ResultIndicator from 'components/ResultIndicator';
import StatusBadge from 'components/StatusBadge';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  badge: {
    display: 'inline-block',
    verticalAlign: 'super',
    marginLeft: theme.spacing.unit * 2,
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
    alignItems: 'center',
  },
});

class HomePage extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      isLoading,
      controller,
      rabbit,
    } = this.props;

    return (
      <div className={classes.container}>
        <DocumentTitle title="控制面板" />
        <Typography
          component="h1"
          variant="display2"
          gutterBottom
        >
          <span>控制面板</span>
          <Typography className={classes.badge} variant="subheading" component="span">
            <StatusBadge status={controller ? 'running' : 'error'} />
          </Typography>
        </Typography>
        <div className={classes.actions}>
          <LoadingButton {...{ isLoading }}>
            <RefreshButton
              isLoading={isLoading}
              onClick={this.props.onStatus}
            />
          </LoadingButton>
          {!isLoading && !controller && (
            <Button
              color="secondary"
              variant="raised"
              onClick={this.props.onStart}
            >
              恢复运行
            </Button>
          )}
        </div>
        <ResultIndicator error={this.props.error} />
        <Paper className={classes.root}>
          <Typography variant="title" className={classes.title}>
            消息队列
          </Typography>
          {!isLoading && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>队列名称</TableCell>
                  <TableCell>排队中</TableCell>
                  <TableCell>执行中</TableCell>
                  <TableCell>最多同时执行</TableCell>
                  <TableCell>执行者数</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {_.toPairs(rabbit).map(([name, q]) => (
                  <TableRow key={name} hover >
                    <TableCell>{name}</TableCell>
                    <TableCell>{q.ready}</TableCell>
                    <TableCell>{q.unacked}</TableCell>
                    <TableCell>{q.prefetches}</TableCell>
                    <TableCell>{q.consumers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <EmptyIndicator isLoading={isLoading} list={rabbit} />
        </Paper>
      </div>
    );
  }
}

HomePage.propTypes = {
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  controller: PropTypes.bool.isRequired,
  rabbit: PropTypes.object,
  error: PropTypes.object,
  onStatus: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(HomePage);
