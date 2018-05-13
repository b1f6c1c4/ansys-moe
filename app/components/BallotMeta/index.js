import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';

import {
  withStyles,
  Typography,
} from 'material-ui';
import { Link } from 'react-router-dom';
import Abbreviation from 'components/Abbreviation';
import DocumentTitle from 'components/DocumentTitle';
import Loading from 'components/Loading';
import StatusBadge from 'components/StatusBadge';

import messages from './messages';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  clickable: {
    cursor: 'pointer',
  },
  badge: {
    display: 'inline-block',
    verticalAlign: 'super',
    marginLeft: theme.spacing.unit * 2,
  },
  scrollable: {
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'pre',
  },
});

class BallotMeta extends React.PureComponent {
  render() {
    const {
      intl,
      classes,
      isLoading,
      ballot,
      bId,
      header,
    } = this.props;

    let subtitle = '';
    if (header) {
      subtitle = `/${intl.formatMessage(header)}`;
    }

    return (
      <div>
        <DocumentTitle title={!isLoading && ballot && (ballot.name + subtitle)} />
        {!isLoading && ballot && (
          <Typography
            component="h1"
            variant="display2"
            gutterBottom
          >
            {this.props.onRefresh && (
              <span
                className={classes.clickable}
                onClick={this.props.onRefresh}
              >
                {ballot.name}
              </span>
            )}
            {!this.props.onRefresh && (
              <Link to={`/app/ballots/${this.props.bId}`}>
                {ballot.name}
              </Link>
            )}
            <Typography className={classes.badge} variant="subheading" component="span">
              <StatusBadge status={ballot.status} />
            </Typography>
            {header && (
              <span>
                /
                <FormattedMessage {...header} />
              </span>
            )}
          </Typography>
        )}
        {isLoading && (
          <Loading />
        )}
        <Typography variant="caption" className={classes.scrollable}>
          <FormattedMessage {...messages.owner} />
          {ballot && ballot.owner}
        </Typography>
        <Typography variant="caption" className={classes.scrollable}>
          <FormattedMessage {...messages.bId} />
          <Abbreviation text={bId} allowExpand />
        </Typography>
      </div>
    );
  }
}

BallotMeta.propTypes = {
  intl: intlShape.isRequired, // eslint-disable-line react/no-typos
  onPush: PropTypes.func.isRequired,
  bId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  ballot: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  header: PropTypes.object,
  onRefresh: PropTypes.func,
};

export default compose(
  injectIntl,
  withStyles(styles),
)(BallotMeta);
