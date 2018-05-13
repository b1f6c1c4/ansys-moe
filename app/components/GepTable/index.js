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
      p,
      dHash,
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
              <TableCell padding="none">名称</TableCell>
              <TableCell padding="none">类型</TableCell>
              <TableCell padding="none">最小值</TableCell>
              <TableCell padding="none">最大值</TableCell>
              <TableCell padding="none">实际值</TableCell>
              <TableCell padding="none">状态</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {_.toPairs(e[kind]).map(([name, gep]) => (
              <TableRow key={name} hover >
                <TableCell padding="none">{name}</TableCell>
                <TableCell padding="none">{gep.cfg.kind}</TableCell>
                <TableCell padding="none">{gep.cfg.lowerBound}</TableCell>
                <TableCell padding="none">{gep.cfg.upperBound}</TableCell>
                <TableCell padding="none">{gep.value}</TableCell>
                <TableCell padding="none"><StatusBadge status={gep.status} /></TableCell>
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
  p: PropTypes.object.isRequired,
  dHash: PropTypes.string.isRequired,
  e: PropTypes.object.isRequired,
  kind: PropTypes.string.isRequired,
};

export default GepTable;
