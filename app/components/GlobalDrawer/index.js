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
} from 'material-ui-icons';
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
  state = { isLangOpen: false };

  handleProfile = () => {
    this.props.onCloseDrawerAction();
    this.props.onPush('/app/');
  };

  handleHelp = () => {
    this.props.onCloseDrawerAction();
    window.location = '/#faq';
  };

  handleLogin = () => {
    this.props.onCloseDrawerAction();
    this.props.onPush('/app/login');
  };

  handleBallot = (b) => () => {
    this.props.onCloseDrawerAction();
    this.props.onPush(`/app/ballots/${b.bId}`);
  };

  handleLanguageList = () => this.setState({ isLangOpen: !this.state.isLangOpen });

  handleLanguage = (lo) => () => {
    this.setState({ isLangOpen: false });
    this.props.onLanguage(lo);
  };

  render() {
    const {
      classes,
      username,
      listBallots,
    } = this.props;

    let ballots;
    if (username && listBallots) {
      ballots = listBallots.map((b) => {
        const content = (
          <Link to={`/app/ballots/${b.bId}`}>
            {b.name}
            <StatusBadge status={b.status} minor />
          </Link>
        );
        return (
          <ListItem key={b.bId} button onClick={this.handleBallot(b)}>
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
          {ballots}
        </List>
      </Drawer>
    );
  }
}

GlobalDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  onPush: PropTypes.func.isRequired,
  onLanguage: PropTypes.func.isRequired,
  username: PropTypes.string,
  listBallots: PropTypes.array,
  isDrawerOpen: PropTypes.bool.isRequired,
  onCloseDrawerAction: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(GlobalDrawer);
