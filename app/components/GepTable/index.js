import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import {
  Paper,
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  Typography,
} from 'material-ui';
import StatusBadge from 'components/StatusBadge';
import EmptyIndicator from 'components/EmptyIndicator';

class GepTable extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      header,
      e,
      kind,
    } = this.props;

    return (
      <Paper className={classes.root}>
        <Typography variant="title" className={classes.title}>
          {header}
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>最小值</TableCell>
              <TableCell>最大值</TableCell>
              <TableCell>实际值</TableCell>
              <TableCell>状态</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {_.sortBy(_.toPairs(e[kind]), 'name').map(([name, gep]) => (
              <TableRow key={name} hover >
                <TableCell>{name}</TableCell>
                <TableCell>{gep.cfg.kind}</TableCell>
                <TableCell>{gep.cfg.lowerBound}</TableCell>
                <TableCell>{gep.cfg.upperBound}</TableCell>
                <TableCell>{gep.value}</TableCell>
                <TableCell><StatusBadge status={gep.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <EmptyIndicator list={e[kind]} />
      </Paper>
    );
  }
}

GepTable.propTypes = {
  classes: PropTypes.object.isRequired,
  header: PropTypes.string.isRequired,
  e: PropTypes.object.isRequired,
  kind: PropTypes.string.isRequired,
};

export default GepTable;
