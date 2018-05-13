import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui';
import Button from 'components/Button';

// eslint-disable-next-line no-unused-vars
const styles = (theme) => ({
});

class ConfirmDialog extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const { classes } = this.props;

    return (
      <Dialog
        keepMounted
        disableBackdropClick
        fullWidth
        open={this.props.isOpen}
        onClose={this.props.onCancel}
      >
        <DialogTitle>
          {this.props.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {this.props.description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={this.props.onCancel}
            color="secondary"
          >
            取消
          </Button>
          <Button
            onClick={this.props.onAction}
            color="primary"
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

ConfirmDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  title: PropTypes.object.isRequired,
  description: PropTypes.object.isRequired,
  isOpen: PropTypes.bool,
  onCancel: PropTypes.func,
  onAction: PropTypes.func,
};

export default compose(
  withStyles(styles),
)(ConfirmDialog);
