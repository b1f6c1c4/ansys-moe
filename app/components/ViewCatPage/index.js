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
import DocumentTitle from 'components/DocumentTitle';
import StatusBadge from 'components/StatusBadge';
import ResultIndicator from 'components/ResultIndicator';
import ConfirmDialog from 'components/ConfirmDialog';
import EmptyIndicator from 'components/EmptyIndicator';
import Button from 'components/Button';
import RefreshButton from 'components/RefreshButton';

import { CatCanStop } from 'utils/permission';

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

class ViewCatPage extends React.PureComponent {
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
      isLoading,
      listHash,
      listProj,
    } = this.props;

    if (!listProj || !(proj in listProj)) return null;

    const p = listProj[proj];
    const cat = p.cat[cHash];

    return (
      <div className={classes.container}>
        <DocumentTitle title={`${proj}/${cHash}`} />
        <Typography
          component="h1"
          variant="display2"
          gutterBottom
        >
          <span>分类监控 - {proj}/{cHash}</span>
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
          {!isLoading && CatCanStop(cat) && (
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
          description="点击确认后，该分类将会被标记为“错误”状态。"
          isOpen={this.state.isOpenStop}
          onCancel={this.handleConfirm()}
          onAction={this.handleConfirm(this.props.onStop)}
        />
        <ResultIndicator error={this.props.error} />
        <Paper className={classes.root}>
          <Typography variant="title" className={classes.title}>
            迭代
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="none">迭代编号</TableCell>
                <TableCell padding="none">迭代参数</TableCell>
                <TableCell padding="none">目标函数</TableCell>
                <TableCell padding="none">迭代状态</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {_.toPairs(cat.eval).map(([dHash, e]) => (
                <TableRow
                  key={dHash}
                  hover
                  onClick={this.handleClick(dHash)}
                  className={classes.clickable}
                >
                  <TableCell padding="none">{dHash}</TableCell>
                  <TableCell padding="none">
                    {JSON.stringify(listHash.dHash[dHash])}
                  </TableCell>
                  <TableCell padding="none">{_.get(p, ['results', 'd', dHash, 'P0'])}</TableCell>
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
