import React from 'react';
import PropTypes from 'prop-types';

import RawDocumentTitle from 'react-document-title';

class DocumentTitle extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { title, isPure } = this.props;

    const globalTitle = isPure ? '' : 'Ansys-MOE';

    if (!title) {
      return (
        <RawDocumentTitle title={globalTitle} />
      );
    }

    return (
      <RawDocumentTitle title={`${title} - ${globalTitle}`} />
    );
  }
}

DocumentTitle.propTypes = {
  title: PropTypes.any,
  isPure: PropTypes.bool,
};

export default DocumentTitle;
