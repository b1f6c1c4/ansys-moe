import 'react-vis/es/styles/plot.scss';

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Paper,
  Typography,
} from 'material-ui';
import { format } from 'date-fns';
import {
  FlexibleXYPlot,
  AreaSeries,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  LineSeries,
} from 'react-vis';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    padding: theme.spacing.unit,
    overflowX: 'auto',
  },
});

class IterMonitor extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      lb,
      ub,
      minEI,
    } = this.props;

    const ubs = _.map(ub, 'y').sort((a, b) => a - b);
    const lbs = _.map(lb, 'y').sort((a, b) => a - b);
    const mid = (arr) => arr[Math.floor(arr.length / 2)];
    let yDomain;
    if (lb.length) {
      yDomain = [
        /* eslint-disable no-mixed-operators */
        Math.min(ubs[0], Math.max(mid(lbs) * 2 - lbs[lbs.length - 1], lbs[0])),
        Math.min(mid(ubs) * 2 - ubs[0], ubs[ubs.length - 1]),
        /* eslint-enable no-mixed-operators */
      ];
    } else {
      yDomain = [
        ubs[0],
        Math.min(ubs[ubs.length / 2] * 2, ubs[ubs.length - 1]),
      ];
    }
    const d = yDomain[1] - yDomain[0];
    yDomain[0] -= 0.1 * d;
    yDomain[1] += 0.1 * d;
    const ulb = ub.map(({ x, y }) => ({ x, y, y0: y - minEI }));

    return (
      <Paper className={classes.root}>
        <Typography variant="title" className={classes.title}>
          收敛情况
        </Typography>
        <FlexibleXYPlot
          height={300}
          yDomain={yDomain}
          xType="time"
        >
          <HorizontalGridLines />
          <VerticalGridLines />
          <AreaSeries
            data={ulb}
            style={{ opacity: 0.4 }}
          />
          <LineSeries
            data={lb}
          />
          <LineSeries
            data={ub}
          />
          <XAxis
            tickTotal={3}
            tickFormat={(v) => format(v, 'YYYY-MM-DD HH:mm:ss')}
          />
          <YAxis />
        </FlexibleXYPlot>
      </Paper>
    );
  }
}

IterMonitor.propTypes = {
  classes: PropTypes.object.isRequired,
  minEI: PropTypes.number.isRequired,
  lb: PropTypes.array.isRequired,
  ub: PropTypes.array.isRequired,
};

export default compose(
  withStyles(styles),
)(IterMonitor);
