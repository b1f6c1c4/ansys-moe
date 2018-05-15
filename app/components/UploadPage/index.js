import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { format } from 'date-fns';

import {
  withStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from 'material-ui';
import { CloudUpload } from '@material-ui/icons';
import ReactFileReader from 'react-file-reader';
import DocumentTitle from 'components/DocumentTitle';
import Button from 'components/Button';
import EmptyIndicator from 'components/EmptyIndicator';
import LoadingButton from 'components/LoadingButton';
import RefreshButton from 'components/RefreshButton';
import ResultIndicator from 'components/ResultIndicator';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
  container: {
    width: '100%',
    padding: theme.spacing.unit,
  },
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    padding: theme.spacing.unit,
    overflowX: 'auto',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});

class UploadPage extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      isLoading,
      files,
    } = this.props;

    return (
      <div className={classes.container}>
        <DocumentTitle title="上传仿真文件" />
        <Typography
          component="h1"
          variant="display2"
          gutterBottom
        >
          <span>上传仿真文件</span>
        </Typography>
        <div className={classes.actions}>
          <LoadingButton {...{ isLoading }}>
            <RefreshButton
              isLoading={isLoading}
              onClick={this.props.onList}
            />
          </LoadingButton>
          <ReactFileReader
            handleFiles={this.props.onUpload}
            fileTypes={['.aedt', '.mxwl']}
            multipleFiles
          >
            <LoadingButton {...{ isLoading }}>
              <Button
                color="primary"
                variant="raised"
                disabled={isLoading}
              >
                上传
                <CloudUpload className={classes.rightIcon} />
              </Button>
            </LoadingButton>
          </ReactFileReader>
        </div>
        <ResultIndicator error={this.props.error} />
        <Paper className={classes.root}>
          <Typography variant="title" className={classes.title}>
            已有文件
          </Typography>
          {files && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="none">源文件名</TableCell>
                  <TableCell padding="none">文件名</TableCell>
                  <TableCell padding="none">文件大小</TableCell>
                  <TableCell padding="none">上传时间</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {_.orderBy(files, 'createdAt', ['desc']).map((file) => (
                  <TableRow key={file.name} hover >
                    <TableCell padding="none">{file.old}</TableCell>
                    <TableCell padding="none"><pre>{file.name}</pre></TableCell>
                    <TableCell padding="none">{file.size}</TableCell>
                    <TableCell padding="none">{file.createdAt && format(file.createdAt, 'YYYY-MM-DD HH:mm:ss')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <EmptyIndicator isLoading={isLoading} list={files} />
        </Paper>
      </div>
    );
  }
}

UploadPage.propTypes = {
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  files: PropTypes.array,
  error: PropTypes.object,
  onList: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(UploadPage);
