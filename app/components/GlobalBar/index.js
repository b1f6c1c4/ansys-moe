import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { compose } from 'redux';

import {
  withStyles,
  AppBar,
  IconButton,
  Toolbar,
  Typography,
} from 'material-ui';
import { AccountCircle, Menu as MenuIcon } from 'material-ui-icons';
import { Link } from 'react-router-dom';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  header: {
    flex: 1,
    cursor: 'pointer',
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
  accountButton: {
    textTransform: 'none',
    paddingRight: 10,
  },
  rightIcon: {
    marginLeft: 5,
  },
});

class GlobalBar extends React.PureComponent {
  state = { anchorEl: null };

  componentDidUpdate() {
    // eslint-disable-next-line react/no-find-dom-node
    const anchorEl = ReactDOM.findDOMNode(this.anchorEl);
    if (this.state.anchorEl !== anchorEl) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ anchorEl });
    }
  }

  handleDrawer = () => this.props.isDrawerOpen
    ? this.props.onCloseDrawerAction()
    : this.props.onOpenDrawerAction();

  render() {
    const { classes } = this.props;

    return (
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            className={classes.menuButton}
            color="inherit"
            aria-label="Menu"
            onClick={this.handleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="div"
            onClick={this.handleProfile}
            variant="headline"
            color="inherit"
            className={classes.header}
          >
            Ansys-MOE 自动化设计系统
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}

GlobalBar.propTypes = {
  classes: PropTypes.object.isRequired,
  onPush: PropTypes.func.isRequired,
  isDrawerOpen: PropTypes.bool.isRequired,
  onOpenDrawerAction: PropTypes.func.isRequired,
  onCloseDrawerAction: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(GlobalBar);
