import _ from 'lodash-es';
import React from 'react';

import {
  withStyles,
} from 'material-ui';

const styles = {
  hidden: {
    display: 'none',
  },
};

// eslint-disable react/no-multi-comp
class TreeNode extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { open: true };
  }

  render() {
    const { classes } = this.props;

    return (
      <React.Fragment>
        <li>
          <pre>{this.props.name}={this.props.value || ''}</pre>
        </li>
        <ul className={this.state.open ? '' : classes.hidden}>
          {this.props.children}
        </ul>
      </React.Fragment>
    );
  }
}

const StyledTreeNode = withStyles(styles)(TreeNode);

function resolve(entries) {
  return _.chain(entries)
    .map(({ key, value }) => {
      const m = key.match(/^(\/[^/]*)(\/.*)?$/);
      if (!m) {
        return { k: key, key: '', value };
      }
      return { k: m[1], key: m[2] || '', value };
    })
    .groupBy('k')
    .toPairs()
    .map(([k, vals]) => (
      <StyledTreeNode
        key={k}
        value={_.get(_.find(vals, { key: '' }), 'value')}
      >
        {resolve(_.reject(vals, { key: '' }))}
      </StyledTreeNode>
    ))
    .value();
}

// eslint-disable-next-line
class TreeView extends React.PureComponent {
  render() {
    return (
      <ul>
        {resolve(this.props.entries)}
      </ul>
    );
  }
}

export default TreeView;
