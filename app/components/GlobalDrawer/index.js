import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage } from 'react-intl';

import {
  withStyles,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from 'material-ui';
import {
  ExpandLess,
  ExpandMore,
  HelpOutline,
  Home,
  Language,
  Lock,
} from 'material-ui-icons';
import { Link } from 'react-router-dom';
import StatusBadge from 'components/StatusBadge';

import * as rawResources from 'translations';
import messages from './messages';

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

    const langs = _.toPairs(rawResources).map(([k, v]) => (
      <ListItem
        key={k}
        button
        className={classes.nested}
        onClick={this.handleLanguage(k)}
      >
        <ListItemText primary={v.lang} />
      </ListItem>
    ));

    return (
      <Drawer
        open={this.props.isDrawerOpen}
        onClose={this.props.onCloseDrawerAction}
      >
        <List
          component="nav"
          className={classes.drawer}
        >
          {!username && (
            <ListItem button onClick={this.handleLogin}>
              <ListItemIcon>
                <Link to="/app/login">
                  <Lock />
                </Link>
              </ListItemIcon>
              <ListItemText
                className={classes.item}
                primary={(
                  <Link to="/app/login">
                    <FormattedMessage {...messages.login} />
                  </Link>
                )}
              />
            </ListItem>
          )}
          {username && (
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
                    <FormattedMessage {...messages.profile} />
                  </Link>
                )}
              />
            </ListItem>
          )}
          <ListItem button onClick={this.handleHelp}>
            <ListItemIcon>
              <a href="/#faq">
                <HelpOutline />
              </a>
            </ListItemIcon>
            <ListItemText
              className={classes.item}
              primary={(
                <a href="/#faq">
                  <FormattedMessage {...messages.help} />
                </a>
              )}
            />
          </ListItem>
          <Divider />
          <ListItem button onClick={this.handleLanguageList}>
            <ListItemIcon>
              <Language />
            </ListItemIcon>
            <ListItemText
              className={classes.item}
              primary={(
                <span>
                  Language/语言
                </span>
              )}
            />
            {this.state.isLangOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={this.state.isLangOpen} timeout="auto" unmountOnExit>
            <List component="div">
              {langs}
            </List>
          </Collapse>
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
