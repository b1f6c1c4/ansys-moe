import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { ProjCanStop, ProjCanDrop } from 'utils/permission';

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
import { Delete, Edit, Stop } from '@material-ui/icons';
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
});

class ViewProjPage extends React.PureComponent {
  state = {
    isOpenStop: false,
    isOpenDrop: false,
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

  handleClick = (cHash) => () => this.props.onPush(`/app/p/${this.props.proj}/cat/${cHash}`);

  handleEdit = () => this.props.onEditAction();

  render() {
    const {
      // eslint-disable-next-line no-unused-vars
      classes,
      proj,
      isLoading,
      listHash,
      listProj,
    } = this.props;

    if (!listProj || !(proj in listProj)) return null;
    const p = listProj[proj];
    if (!p || !p.config) return null;

    return (
      <div className={classes.container}>
        <DocumentTitle title={proj} />
        <Typography
          component="h1"
          variant="display2"
          gutterBottom
        >
          <span>项目监控 - {proj}</span>
          <Typography className={classes.badge} variant="subheading" component="span">
            <StatusBadge status={p.status} />
          </Typography>
        </Typography>
        <div className={classes.actions}>
          {!isLoading && (
            <RefreshButton
              onClick={this.props.onRefresh}
            />
          )}
          <Button
            color="primary"
            variant="raised"
            onClick={this.handleEdit}
          >
            编辑配置
            <Edit className={classes.rightIcon} />
          </Button>
          {!isLoading && ProjCanStop(p) && (
            <Button
              color="secondary"
              onClick={this.handleConfirm('isOpenStop')}
            >
              终止执行
              <Stop className={classes.rightIcon} />
            </Button>
          )}
          {!isLoading && ProjCanDrop(p) && (
            <Button
              color="secondary"
              variant="raised"
              onClick={this.handleConfirm('isOpenDrop')}
            >
              彻底删除
              <Delete className={classes.rightIcon} />
            </Button>
          )}
        </div>
        <ConfirmDialog
          title="确认终止执行"
          description="点击确认后，该项目将会被标记为“错误”状态。"
          isOpen={this.state.isOpenStop}
          onCancel={this.handleConfirm()}
          onAction={this.handleConfirm(this.props.onStop)}
        />
        <ConfirmDialog
          title="确认彻底删除"
          description="点击确认后，该项目的全部状态信息将会被删除。若需恢复，需要手工在etcd集群上恢复。"
          isOpen={this.state.isOpenDrop}
          onCancel={this.handleConfirm()}
          onAction={this.handleConfirm(this.props.onDrop)}
        />
        <ResultIndicator error={this.props.error} />
        <Paper className={classes.root}>
          <Typography variant="title" className={classes.title}>
            分类
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="none">分类编号</TableCell>
                <TableCell padding="none">分类参数</TableCell>
                <TableCell padding="none">正在迭代</TableCell>
                <TableCell padding="none">完成迭代</TableCell>
                <TableCell padding="none">分类状态</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {_.sortBy(_.toPairs(p.cat), 0).map(([cHash, cat]) => (
                <TableRow
                  key={cHash}
                  hover
                  onClick={this.handleClick(cHash)}
                  className={classes.clickable}
                >
                  <TableCell padding="none">{cHash}</TableCell>
                  <TableCell padding="none">
                    {JSON.stringify(listHash.cHash[cHash])}
                  </TableCell>
                  <TableCell padding="none">{_.keys(cat.ongoing).length}</TableCell>
                  <TableCell padding="none">{cat.history.length}</TableCell>
                  <TableCell padding="none"><StatusBadge status={cat.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <EmptyIndicator list={p.cat} />
        </Paper>
      </div>
    );
  }
}

ViewProjPage.propTypes = {
  onPush: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  proj: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  listHash: PropTypes.object,
  listProj: PropTypes.object,
  error: PropTypes.object,
  onStop: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onEditAction: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(ViewProjPage);
