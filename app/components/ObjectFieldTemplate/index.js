import _ from 'lodash';
import React from 'react';
import { compose } from 'redux';

import {
  withStyles,
  Grid,
  Typography,
} from 'material-ui';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  wrapper: {
    padding: theme.spacing.unit,
  },
  desc: {
    display: 'inline-block',
  },
});

/* eslint-disable react/prop-types */
class ObjectFieldTemplate extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes } = this.props;

    const decideSize = (name) => {
      const size = _.get(this.props, ['uiSchema', name, 'size']);
      if (_.isPlainObject(size)) return size;
      switch (size) {
        case 12:
          return { xs: 12, sm: 12, md: 12 };
        case 6:
          return { xs: 12, sm: 12, md: 6 };
        case 4:
          return { xs: 12, sm: 6, md: 4 };
        case 3:
          return { xs: 12, sm: 6, md: 3 };
        case 2:
          return { xs: 6, sm: 4, md: 2 };
        case 1:
          return { xs: 6, sm: 3, md: 1 };
        default:
          break;
      }
      const type = _.get(this.props, ['schema', 'properties', name, 'type']);
      switch (type) {
        case 'array':
        case 'object':
          return { xs: 12, sm: 12, md: 12 };
        default:
          return { xs: 12, sm: 6, md: 4 };
      }
    };
    const content = (
      <React.Fragment>
        {(this.props.title || this.props.description) && (
          <Typography variant={_.get(this.props, 'uiSchema.title')}>
            {this.props.title}
            <Typography component="span" variant="caption" className={classes.desc}>
              {this.props.description}
            </Typography>
          </Typography>
        )}
        <Grid container spacing={8}>
          {this.props.properties.map((e) => (
            <Grid item key={e.content.key} {...decideSize(e.name)}>
              {e.content}
            </Grid>
          ))}
        </Grid>
      </React.Fragment>
    );
    const wrapper = _.get(this.props, 'uiSchema.padding', true)
      ? classes.wrapper
      : undefined;
    return <div className={wrapper}>{content}</div>;
  }
}

export default compose(
  withStyles(styles),
)(ObjectFieldTemplate);
