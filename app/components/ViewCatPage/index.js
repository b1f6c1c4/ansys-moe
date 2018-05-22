import 'react-vis/es/styles/plot.scss';
import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { CatCanStop } from 'utils/permission';

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
import { CloudDownload, Stop } from '@material-ui/icons';
import {
  FlexibleXYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  LineSeries,
} from 'react-vis';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import downloadCsv from 'download-csv';
import Button from 'components/Button';
import ConfirmDialog from 'components/ConfirmDialog';
import DocumentTitle from 'components/DocumentTitle';
import EmptyIndicator from 'components/EmptyIndicator';
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
  optimal: {
    fontWeight: 900,
    color: 'red',
  },
});

class ViewCatPage extends React.PureComponent {
  state = {
    isOpenStop: false,
    xScale: null,
    xScaleBrush: null,
  };

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.proj, this.props.proj)) {
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

  handleClick = (dHash) => () => this.props.onPush(`/app/p/${this.props.proj}/cat/${this.props.cHash}/d/${dHash}`);

  handleExport = () => {
    const { proj, cHash, listProj } = this.props;
    const mapper = (e) => ({
      ...e.var,
      _P0: e.P0,
    });
    downloadCsv(
      _.values(_.get(listProj, [proj, 'cat', cHash, 'eval'])).map(mapper),
      {
        _P0: '目标函数',
      },
      `${proj}-${cHash}.csv`,
    );
  };

  render() {
    const {
      // eslint-disable-next-line no-unused-vars
      classes,
      proj,
      cHash,
      isLoading,
      listHash,
      listProj,
    } = this.props;

    if (!listProj || !(proj in listProj)) return null;
    const p = listProj[proj];
    if (!p || !p.config) return null;
    const cat = p.cat[cHash];
    if (!cat) return null;

    const ub = [];
    const lb = [];
    const events = [];
    _.values(cat.eval).forEach((e) => {
      if (e.startTime && e.ei !== undefined) {
        events.push({ time: e.startTime, ei: e.ei });
      }
      if (e.endTime) {
        events.push({ time: e.endTime, p0: e.P0 });
      }
    });
    let opt = Infinity;
    const sorted = _.sortBy(events, 'time');
    // eslint-disable-next-line no-restricted-syntax
    for (const e of sorted) {
      if (e.p0 !== undefined) {
        if (e.p0 < opt) {
          if (_.isFinite(opt)) {
            ub.push({ x: new Date(e.time - 1), y: opt });
          }
          opt = e.p0;
          ub.push({ x: e.time, y: opt });
        }
      } else {
        lb.push({ x: e.time, y: opt - e.ei });
      }
    }
    if (events.length && _.isFinite(opt)) {
      ub.push({ x: sorted[sorted.length - 1].time, y: opt });
    }
    const ubs = _.map(ub, 'y').sort((a, b) => a - b);
    const lbs = _.map(lb, 'y').sort((a, b) => a - b);
    let yDomain;
    if (ub.length) {
      if (lb.length) {
        yDomain = [
          /* eslint-disable no-mixed-operators */
          Math.min(ubs[0], Math.max(lbs[lbs.length / 2] * 2 - lbs[lbs.length - 1], lbs[0])),
          Math.min(ubs[ubs.length / 2] * 2 - ubs[0], ubs[ubs.length - 1]),
          /* eslint-enable no-mixed-operators */
        ];
      } else {
        yDomain = [
          ubs[0],
          Math.min(ubs[ubs.length / 2] * 2, ubs[ubs.length - 1]),
        ];
      }
      const d = yDomain[1] - yDomain[0];
      yDomain[0] -= 0.1 * d;
      yDomain[1] += 0.1 * d;
    }

    return (
      <div className={classes.container}>
        <DocumentTitle title={`${proj}/${cHash}`} />
        <Typography
          component="h1"
          variant="display2"
          gutterBottom
        >
          <span>分类监控 - </span>
          <Link to={`/app/p/${proj}`}>{proj}</Link>
          <Typography className={classes.badge} variant="subheading" component="span">
            <StatusBadge status={p.status} />
          </Typography>
          <span>/{cHash}</span>
          <Typography className={classes.badge} variant="subheading" component="span">
            <StatusBadge status={cat.status} />
          </Typography>
        </Typography>
        <div className={classes.actions}>
          {!isLoading && (
            <RefreshButton
              onClick={this.props.onRefresh}
            />
          )}
          {!isLoading && (
            <Button
              color="primary"
              onClick={this.handleExport}
            >
              导出CSV
              <CloudDownload className={classes.rightIcon} />
            </Button>
          )}
          {!isLoading && CatCanStop(cat) && (
            <Button
              color="secondary"
              onClick={this.handleConfirm('isOpenStop')}
            >
              终止执行
              <Stop className={classes.rightIcon} />
            </Button>
          )}
        </div>
        <ConfirmDialog
          title="确认终止执行"
          description="点击确认后，该分类将会被标记为“错误”状态。"
          isOpen={this.state.isOpenStop}
          onCancel={this.handleConfirm()}
          onAction={this.handleConfirm(this.props.onStop)}
        />
        <ResultIndicator error={this.props.error} />
        <Paper className={classes.root}>
          <Typography variant="title" className={classes.title}>
            收敛情况
          </Typography>
          <FlexibleXYPlot
            height={300}
            yDomain={yDomain}
            xType="time"
          >
            <HorizontalGridLines />
            <VerticalGridLines />
            <LineSeries
              data={ub}
            />
            <LineSeries
              data={lb}
            />
            <XAxis
              tickTotal={3}
              tickFormat={(v) => format(v, 'YYYY-MM-DD HH:mm:ss')}
            />
            <YAxis />
          </FlexibleXYPlot>
        </Paper>
        <Paper className={classes.root}>
          <Typography variant="title" className={classes.title}>
            迭代
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="none">迭代编号</TableCell>
                <TableCell padding="none">开始时间</TableCell>
                <TableCell padding="none">结束时间</TableCell>
                <TableCell padding="none">迭代参数</TableCell>
                <TableCell padding="none">目标函数</TableCell>
                <TableCell padding="none">EI</TableCell>
                <TableCell padding="none">迭代状态</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {_.sortBy(_.toPairs(cat.eval), '1.startTime').map(([dHash, e]) => (
                <TableRow
                  key={dHash}
                  hover
                  onClick={this.handleClick(dHash)}
                  className={classes.clickable}
                >
                  <TableCell padding="none">{dHash}</TableCell>
                  <TableCell padding="none">{e.startTime && format(e.startTime, 'YYYY-MM-DD HH:mm:ss')}</TableCell>
                  <TableCell padding="none">{e.endTime && format(e.endTime, 'YYYY-MM-DD HH:mm:ss')}</TableCell>
                  <TableCell padding="none">
                    {JSON.stringify(listHash.dHash[dHash])}
                  </TableCell>
                  <TableCell className={e.isOptimal && classes.optimal} padding="none">
                    {e.P0}
                  </TableCell>
                  <TableCell padding="none">{e.ei}</TableCell>
                  <TableCell padding="none"><StatusBadge status={e.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <EmptyIndicator list={cat.eval} />
        </Paper>
      </div>
    );
  }
}

ViewCatPage.propTypes = {
  onPush: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  proj: PropTypes.string.isRequired,
  cHash: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  listHash: PropTypes.object,
  listProj: PropTypes.object,
  error: PropTypes.object,
  onStop: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(ViewCatPage);
