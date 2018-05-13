import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';

import { Prompt } from 'react-router-dom';
import makeConfirmSave from 'utils/confirm';

import messages from 'utils/messages';

class LeavePrompt extends React.PureComponent {
  componentDidMount() {
    const func = makeConfirmSave(
      this.props.intl,
      () => _.get(this, 'props.isPristine'),
    );

    window.onbeforeunload = func;
  }

  componentWillUnmount() {
    window.onbeforeunload = null;
  }

  msg = () => this.props.intl.formatMessage(messages.beforeLeave);

  render() {
    const { isPristine } = this.props;

    return (
      <Prompt
        when={!isPristine}
        message={this.msg}
      />
    );
  }
}

LeavePrompt.propTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  isPristine: PropTypes.bool.isRequired,
};

export default injectIntl(LeavePrompt);
