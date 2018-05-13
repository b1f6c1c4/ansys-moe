import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import * as globalContainerActions from 'containers/GlobalContainer/actions';

export class ErrorBoundary extends React.PureComponent {
  state = {
    error: null,
    info: null,
    state: null,
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.state !== this.props.state) {
      this.retry();
    }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error(error, info, this.props.state);
    try {
      this.setState({
        error: error.stack,
        info: info.componentStack,
        state: JSON.stringify(this.props.state.toJS(), null, 2),
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      this.setState({
        error: error.stack,
        info: info.componentStack,
        state: String(this.props.state),
      });
    }
  }

  retry = () => {
    this.setState({ error: null, info: null, state: null });
  };

  resetAll = () => {
    this.retry();
    this.props.onResetAll();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div>
        <h1>Something went wrong.</h1>
        <p>You may try to go back, to refresh the page, or to click the &apos;Reset All&apos; button and see if that helps.</p>
        <p>If all of them fail, please review the following message, remove anything sensitive, and report to us.</p>
        <input type="button" onClick={this.retry} value="Retry" />
        <input type="button" onClick={this.resetAll} value="Reset All" />
        <hr />
        <h1>糟糕！发生错误</h1>
        <p>您可以尝试后退、刷新，或者点击“重置全部”按钮。</p>
        <p>若以上措施均无效，请仔细检查以下错误信息，从中删去敏感信息以后再向我们提交反馈。</p>
        <input type="button" onClick={this.retry} value="重试" />
        <input type="button" onClick={this.resetAll} value="重置全部" />
        <hr />
        <pre>{this.state.error}</pre>
        <pre>{this.state.info}</pre>
        <pre>{this.state.state}</pre>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  state: PropTypes.any,
  children: PropTypes.any,
  onResetAll: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    onResetAll: () => dispatch(globalContainerActions.logout()),
  };
}

const mapStateToProps = createStructuredSelector({
  state: (state) => state,
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(ErrorBoundary);
