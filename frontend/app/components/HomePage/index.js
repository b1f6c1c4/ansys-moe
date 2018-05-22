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
import {
  Add,
  CloudUpload,
  Delete,
  PlayArrow,
} from '@material-ui/icons';
import Button from 'components/Button';
import DocumentTitle from 'components/DocumentTitle';
import EmptyIndicator from 'components/EmptyIndicator';
import LoadingButton from 'components/LoadingButton';
import RefreshButton from 'components/RefreshButton';
import ResultIndicator from 'components/ResultIndicator';
import StatusBadge from 'components/StatusBadge';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  clickable: {
    cursor: 'pointer',
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
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
  handleClick = (proj) => () => this.props.onPush(`/app/p/${proj}`);

  handleUpload = () => this.props.onPush('/app/upload');

  handleDownload = () => this.props.onPush('/app/download');

  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      isLoading,
      controller,
      rabbit,
      listProj,
    } = this.props;

    let status;
    if (!controller) {
      status = 'error';
    } else if (!rabbit) {
      status = 'unknown';
    } else {
      const queued = _.sumBy(_.values(rabbit), (q) => q.ready + q.unacked);
      const noConsumer = _.some(rabbit, (q) => q.ready && !q.prefetches);
      if (noConsumer) {
        status = 'waiting';
      } else if (queued) {
        status = 'running';
      } else {
        status = 'idle';
      }
    }

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
            <StatusBadge status={status} />
          </Typography>
        </Typography>
        <div className={classes.actions}>
          <LoadingButton {...{ isLoading }}>
            <RefreshButton
              isLoading={isLoading}
              onClick={this.props.onStatus}
            />
          </LoadingButton>
          <Button
            color="primary"
            onClick={this.handleUpload}
          >
            上传仿真文件
            <CloudUpload className={classes.rightIcon} />
          </Button>
          <Button
            color="primary"
            variant="raised"
            onClick={this.props.onCreateAction}
          >
            新任务
            <Add className={classes.rightIcon} />
          </Button>
          {!isLoading && !controller && (
            <Button
              color="secondary"
              variant="raised"
              onClick={this.props.onStart}
            >
              恢复运行
              <PlayArrow className={classes.rightIcon} />
            </Button>
          )}
          {!isLoading && (
            <Button
              color="secondary"
              onClick={this.props.onPurge}
            >
              清空队列
              <Delete className={classes.rightIcon} />
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
        <Paper className={classes.root}>
          <Typography variant="title" className={classes.title}>
            项目
          </Typography>
          {listProj && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>项目名称</TableCell>
                  <TableCell>分类总数</TableCell>
                  <TableCell>迭代总数</TableCell>
                  <TableCell>目标函数</TableCell>
                  <TableCell>项目状态</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {_.toPairs(listProj).map(([proj, p]) => (
                  <TableRow
                    key={proj}
                    hover
                    onClick={this.handleClick(proj)}
                    className={classes.clickable}
                  >
                    <TableCell>{proj}</TableCell>
                    <TableCell>{p.cat && _.keys(p.cat).length}</TableCell>
                    <TableCell>{_.sumBy(_.toPairs(p.cat), ([, cat]) => _.keys(cat.eval).length)}</TableCell>
                    <TableCell>{p.optimal}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
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
  onPush: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  controller: PropTypes.bool.isRequired,
  rabbit: PropTypes.object,
  listProj: PropTypes.object,
  error: PropTypes.object,
  onStatus: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onPurge: PropTypes.func.isRequired,
  onCreateAction: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(HomePage);
