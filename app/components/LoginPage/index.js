import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { injectIntl, intlShape } from 'react-intl';

import {
  withStyles,
  AppBar,
  Dialog,
  Tab,
  Tabs,
} from 'material-ui';
import SwipeableViews from 'react-swipeable-views';
import LoginForm from 'components/LoginForm';
import RegisterForm from 'components/RegisterForm';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
});

class LoginPage extends React.PureComponent {
  handleChange = (event, value) => this.props.onChangeActiveIdAction(value);
  handleChangeIndex = (index) => this.props.onChangeActiveIdAction(index);

  render() {
    // eslint-disable-next-line no-unused-vars
    const { intl, classes } = this.props;

    return (
      <Dialog open>
        <AppBar position="static" color="default">
          <Tabs
            value={this.props.activeId}
            onChange={this.handleChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label={intl.formatMessage(messages.login)} />
            <Tab label={intl.formatMessage(messages.register)} />
          </Tabs>
        </AppBar>
        <SwipeableViews
          axis="x"
          index={this.props.activeId}
          onChangeIndex={this.handleChangeIndex}
          disableLazyLoading
        >
          <LoginForm {...this.props} />
          <RegisterForm {...this.props} />
        </SwipeableViews>
      </Dialog>
    );
  }
}

LoginPage.propTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  classes: PropTypes.object.isRequired,
  activeId: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onChangeActiveIdAction: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  onRegister: PropTypes.func.isRequired,
};

export default compose(
  injectIntl,
  withStyles(styles),
)(LoginPage);
