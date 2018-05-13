import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
} from 'material-ui';
import DocumentTitle from 'components/DocumentTitle';
import GlobalBar from 'components/GlobalBar';
import GlobalDrawer from 'components/GlobalDrawer';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  root: {
    width: '100%',
  },
  wrapper: {
    marginTop: 70,
    marginLeft: 'auto',
    marginRight: 'auto',
    maxWidth: 1024,
  },
});

class GlobalPage extends React.PureComponent {
  render() {
    const {
      classes, // eslint-disable-line no-unused-vars
      onPush,
      onLanguage,
      username,
      listBallots,
      isAccountOpen,
      isDrawerOpen,
      onOpenDrawerAction,
      onCloseDrawerAction,
      onOpenAccountAction,
      onCloseAccountAction,
      onLogoutAction,
    } = this.props;

    return (
      <div className={classes.root}>
        <DocumentTitle />
        <GlobalBar
          {...{
            onPush,
            username,
            isAccountOpen,
            isDrawerOpen,
            onOpenDrawerAction,
            onCloseDrawerAction,
            onOpenAccountAction,
            onCloseAccountAction,
            onLogoutAction,
          }}
        />
        <GlobalDrawer
          {...{
            onPush,
            onLanguage,
            username,
            listBallots,
            isDrawerOpen,
            onCloseDrawerAction,
          }}
        />
        <div className={classes.wrapper}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

GlobalPage.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.any,
  onPush: PropTypes.func.isRequired,
  onLanguage: PropTypes.func.isRequired,
  username: PropTypes.string,
  listBallots: PropTypes.array,
  isDrawerOpen: PropTypes.bool.isRequired,
  isAccountOpen: PropTypes.bool.isRequired,
  onOpenDrawerAction: PropTypes.func.isRequired,
  onCloseDrawerAction: PropTypes.func.isRequired,
  onOpenAccountAction: PropTypes.func.isRequired,
  onCloseAccountAction: PropTypes.func.isRequired,
  onLogoutAction: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(GlobalPage);
