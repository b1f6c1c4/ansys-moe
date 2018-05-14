import _ from 'lodash';
import React from 'react';
import { compose } from 'redux';

import {
  withStyles,
  Paper,
  Grid,
  Typography,
} from 'material-ui';
import { Add, ArrowDropDown, ArrowDropUp, Delete } from '@material-ui/icons';
import Button from 'components/Button';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  btn: {
    width: '100%',
    minWidth: 0,
  },
  header: {
    backgroundColor: '#eee',
  },
  odd: {
    backgroundColor: '#f9f9f9',
  },
  even: {
    backgroundColor: '#eee',
  },
  oddBorder: {
    borderBottomWeight: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#f9f9f9',
  },
  evenBorder: {
    borderBottomWeight: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#eee',
  },
});

/* eslint-disable react/prop-types */
class ArrayFieldTemplate extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes } = this.props;

    const interleave = _.get(this.props, 'uiSchema.interleave', true);
    const getRowClass = interleave
      ? (i) => (i % 2) ? classes.even : classes.odd
      : () => undefined;
    const getBorderClass = interleave
      ? (i) => (i % 2) ? classes.evenBorder : classes.oddBorder
      : () => undefined;
    const content = (
      <React.Fragment>
        <Grid container spacing={0} className={classes.header}>
          <Grid item xs={1}>
            <Button
              color="primary"
              className={classes.btn}
              onClick={this.props.onAddClick}
            >
              <Add />
            </Button>
          </Grid>
          <Grid item xs={11}>
            <Typography variant={_.get(this.props, 'uiSchema.title')}>
              {this.props.title}
              <Typography component="span" variant="caption" className={classes.desc}>
                {this.props.description}
              </Typography>
            </Typography>
          </Grid>
        </Grid>
        {this.props.items.map((e, i) => (
          <Grid container spacing={0} className={getBorderClass(i)}>
            <Grid item xs={1} className={getRowClass(i)}>
              {e.hasMoveUp && (
                <Button
                  color="secondary"
                  className={classes.btn}
                  onClick={e.onReorderClick(e.index, e.index - 1)}
                >
                  <ArrowDropUp />
                </Button>
              )}
              <Button
                color="secondary"
                className={classes.btn}
                onClick={e.onDropIndexClick(e.index)}
              >
                <Delete />
              </Button>
              {e.hasMoveDown && (
                <Button
                  color="secondary"
                  className={classes.btn}
                  onClick={e.onReorderClick(e.index, e.index + 1)}
                >
                  <ArrowDropDown />
                </Button>
              )}
            </Grid>
            <Grid item xs={11}>
              {e.children}
            </Grid>
          </Grid>
        ))}
      </React.Fragment>
    );
    if (_.get(this.props, 'uiSchema.paper')) {
      return <Paper>{content}</Paper>;
    }
    return <div>{content}</div>;
  }
}

export default compose(
  withStyles(styles),
)(ArrayFieldTemplate);
