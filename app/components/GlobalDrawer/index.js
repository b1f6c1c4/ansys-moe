import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from 'material-ui';
import {
  Home,
} from '@material-ui/icons';
import { Link } from 'react-router-dom';
import StatusBadge from 'components/StatusBadge';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  drawer: {
    width: 300,
  },
  nested: {
    paddingLeft: theme.spacing.unit * 4,
  },
  item: {
    paddingLeft: 0,
  },
});

class GlobalDrawer extends React.PureComponent {
  handleProj = (name) => () => {
    this.props.onCloseDrawerAction();
    this.props.onPush(`/app/p/${name}`);
  };

  render() {
    const {
      classes,
      listProj,
    } = this.props;

    let projs;
    if (listProj) {
      projs = _.toPairs(listProj).map(([name, p]) => {
        const content = (
          <Link to={`/app/p/${name}`}>
            {name}
            <StatusBadge status={p.status} minor />
          </Link>
        );
        return (
          <ListItem key={name} button onClick={this.handleProj(name)}>
            <ListItemText primary={content} />
          </ListItem>
        );
      });
    }

    return (
      <Drawer
        open={this.props.isDrawerOpen}
        onClose={this.props.onCloseDrawerAction}
      >
        <List
          component="nav"
          className={classes.drawer}
        >
          <ListItem button onClick={this.handleProfile}>
            <ListItemIcon>
              <Link to="/app/">
                <Home />
              </Link>
            </ListItemIcon>
            <ListItemText
              className={classes.item}
              primary={(
                <Link to="/app/">
                  控制面板
                </Link>
              )}
            />
          </ListItem>
          <Divider />
          {projs}
        </List>
      </Drawer>
    );
  }
}

GlobalDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  onPush: PropTypes.func.isRequired,
  listProj: PropTypes.object,
  isDrawerOpen: PropTypes.bool.isRequired,
  onCloseDrawerAction: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(GlobalDrawer);
