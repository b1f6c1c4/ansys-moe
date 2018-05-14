import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Paper,
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  Typography,
} from 'material-ui';
import { Link } from 'react-router-dom';
import DocumentTitle from 'components/DocumentTitle';
import StatusBadge from 'components/StatusBadge';
import ResultIndicator from 'components/ResultIndicator';
import ConfirmDialog from 'components/ConfirmDialog';
import Button from 'components/Button';
import RefreshButton from 'components/RefreshButton';
import GepTable from 'components/GepTable';

import { EvalCanStop } from 'utils/permission';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  clickable: {
    cursor: 'pointer',
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

class ViewEvalPage extends React.PureComponent {
  state = {
    isOpenStop: false,
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

  render() {
    const {
      // eslint-disable-next-line no-unused-vars
      classes,
      proj,
      cHash,
      dHash,
      isLoading,
      listProj,
    } = this.props;

    if (!listProj || !(proj in listProj)) return null;
    const p = listProj[proj];
    if (!p || !p.config) return null;
    const cat = p.cat[cHash];
    if (!cat) return null;
    const e = cat.eval[dHash];
    if (!e) return null;
    const mId = _.get(p, ['results', 'd', dHash, 'Mid']);
    const m = mId !== undefined && p.config.ansys.rules[mId];

    return (
      <div className={classes.container}>
        <DocumentTitle title={`${proj}/${cHash}/${dHash}`} />
        <Typography
          component="h1"
          variant="display2"
          gutterBottom
        >
          <span>迭代监控 - </span>
          <Link to={`/app/p/${proj}`}>{proj}</Link>
          <Typography className={classes.badge} variant="subheading" component="span">
            <StatusBadge status={p.status} />
          </Typography>
          <span>/</span>
          <Link to={`/app/p/${proj}/cat/${cHash}`}>{cHash}</Link>
          <Typography className={classes.badge} variant="subheading" component="span">
            <StatusBadge status={cat.status} />
          </Typography>
          <span>/{dHash}</span>
          <Typography className={classes.badge} variant="subheading" component="span">
            <StatusBadge status={e.status} />
          </Typography>
        </Typography>
        <div className={classes.actions}>
          {!isLoading && (
            <RefreshButton
              onClick={this.props.onRefresh}
            />
          )}
          {!isLoading && EvalCanStop(e) && (
            <Button
              color="secondary"
              onClick={this.handleConfirm('isOpenStop')}
            >
              终止执行
            </Button>
          )}
        </div>
        <ConfirmDialog
          title="确认终止执行"
          description="点击确认后，该迭代将会被标记为“错误”状态。"
          isOpen={this.state.isOpenStop}
          onCancel={this.handleConfirm()}
          onAction={this.handleConfirm(this.props.onStop)}
        />
        <ResultIndicator error={this.props.error} />
        <GepTable
          classes={classes}
          header="几何参数"
          p={p}
          dHash={dHash}
          e={e}
          kind="G"
        />
        <Paper className={classes.root}>
          <Typography variant="title" className={classes.title}>
            磁模型仿真
          </Typography>
          {m && (
            <React.Fragment>
              <Typography>
                <span>源文件：{m.source}</span>
                <br />
                <span>项目文件名：{m.destination}</span>
              </Typography>
              <Typography variant="subheading">
                仿真参数
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>名称</TableCell>
                    <TableCell>设计名称</TableCell>
                    <TableCell>变量</TableCell>
                    <TableCell>实际值</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {m.inputs.map((o) => (
                    <TableRow key={o.name} hover >
                      <TableCell>{o.name}</TableCell>
                      <TableCell>{o.design}</TableCell>
                      <TableCell>{o.variable}</TableCell>
                      <TableCell>{_.get(p, ['results', 'd', dHash, 'var', o.variable])}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="subheading">
                仿真结果
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>名称</TableCell>
                    <TableCell>设计名称</TableCell>
                    <TableCell>表格名称</TableCell>
                    <TableCell>列编号</TableCell>
                    <TableCell>最小值</TableCell>
                    <TableCell>最大值</TableCell>
                    <TableCell>实际值</TableCell>
                    <TableCell>状态</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {_.sortBy(_.toPairs(e.M), 0).map(([name, mm]) => (
                    <TableRow key={name} hover >
                      <TableCell>{name}</TableCell>
                      <TableCell>{mm.rule.design}</TableCell>
                      <TableCell>{mm.rule.table}</TableCell>
                      <TableCell>{mm.rule.column}</TableCell>
                      <TableCell>{mm.rule.lowerBound}</TableCell>
                      <TableCell>{mm.rule.upperBound}</TableCell>
                      <TableCell>{mm.value}</TableCell>
                      <TableCell><StatusBadge status={mm.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </React.Fragment>
          )}
          {!m && (
            <Typography>
              仿真未开始或没有匹配的仿真规则
            </Typography>
          )}
        </Paper>
        <GepTable classes={classes} header="电参数" e={e} kind="E" />
        <GepTable classes={classes} header="性能参数" e={e} kind="P" />
      </div>
    );
  }
}

ViewEvalPage.propTypes = {
  onPush: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  proj: PropTypes.string.isRequired,
  cHash: PropTypes.string.isRequired,
  dHash: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  listProj: PropTypes.object,
  error: PropTypes.object,
  onStop: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(ViewEvalPage);
