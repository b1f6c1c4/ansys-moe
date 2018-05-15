import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
} from 'material-ui';
import classnames from 'classnames';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  major: {
    display: 'inline-block',
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingTop: theme.spacing.unit / 2,
    paddingBottom: theme.spacing.unit / 2,
    borderRadius: theme.spacing.unit / 2,
  },
  minor: {
    display: 'inline-block',
    fontSize: 12,
    marginLeft: theme.spacing.unit,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    borderRadius: theme.spacing.unit / 2,
  },
  unknown: {
    backgroundColor: '#3e2723',
    color: '#fff',
  },
  idle: {
    backgroundColor: '#7f7',
    color: '#000',
  },
  waiting: {
    backgroundColor: '#bce7e0',
    color: '#000',
  },
  init: {
    backgroundColor: '#cddc39',
    color: '#000',
  },
  running: {
    backgroundColor: '#9c27b0',
    color: '#fff',
  },
  iter: {
    backgroundColor: '#ffc107',
    color: '#000',
  },
  done: {
    backgroundColor: '#2196f3',
    color: '#fff',
  },
  error: {
    backgroundColor: '#ff5722',
    color: '#fff',
  },
  Grun: {
    backgroundColor: '#9c27b0',
    color: '#fff',
  },
  Mrun: {
    backgroundColor: '#9c27b0',
    color: '#fff',
  },
  Erun: {
    backgroundColor: '#9c27b0',
    color: '#fff',
  },
  Prun: {
    backgroundColor: '#9c27b0',
    color: '#fff',
  },
  out: {
    backgroundColor: '#607d8B',
    color: '#fff',
  },
});

class StatusBadge extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes, status, minor } = this.props;

    const cls = minor ? classes.minor : classes.major;

    const messages = {
      idle: '空闲',
      waiting: '等待中',
      init: '初始化',
      running: '运行中',
      iter: '计算迭代',
      done: '成功',
      error: '错误',
      Grun: '几何参数',
      Mrun: 'ANSYS',
      Erun: '电参数',
      Prun: '性能参数',
      out: '出界',
    };

    if (!messages[status]) {
      return (
        <div className={classnames(cls, classes.unknown)}>
          {status}
        </div>
      );
    }

    return (
      <div className={classnames(cls, classes[status])}>
        {messages[status]}
      </div>
    );
  }
}

StatusBadge.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.string,
  minor: PropTypes.bool,
};

StatusBadge.defaultProps = {
  minor: false,
};

export default compose(
  withStyles(styles),
)(StatusBadge);
