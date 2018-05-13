import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { injectIntl, intlShape } from 'react-intl';

import RawDocumentTitle from 'react-document-title';

import messages from 'utils/messages';

class DocumentTitle extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { intl, title, isPure } = this.props;

    const globalTitle = isPure ? '' : intl.formatMessage(messages.globalTitle);

    if (!title) {
      return (
        <RawDocumentTitle title={globalTitle} />
      );
    }

    if (_.isString(title)) {
      return (
        <RawDocumentTitle title={`${title} - ${globalTitle}`} />
      );
    }

    return (
      <RawDocumentTitle title={`${intl.formatMessage(title)} - ${globalTitle}`} />
    );
  }
}

DocumentTitle.propTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  title: PropTypes.any,
  isPure: PropTypes.bool,
};

export default compose(
  injectIntl,
)(DocumentTitle);
