import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Paper,
  TextField,
  MenuItem,
  Typography,
} from 'material-ui';
import Form from 'react-jsonschema-form';
import DocumentTitle from 'components/DocumentTitle';
import Button from 'components/Button';
import ArrayFieldTemplate from 'components/ArrayFieldTemplate';
import ObjectFieldTemplate from 'components/ObjectFieldTemplate';

import schema from './schema.json5';
import uiSchema from './uiSchema.json5';

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

/* eslint-disable react/prop-types */
function TextWidget(props) {
  return (
    <TextField
      fullWidth
      multiline={_.get(props, 'uiSchema.multiline')}
      disabled={props.disabled}
      required={props.required}
      error={!!props.rawErrors}
      id={props.id}
      value={props.value}
      label={props.label}
      helperText={props.schema.description}
      margin="dense"
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

function SelectWidget(props) {
  return (
    <TextField
      select
      SelectProps={{ native: false }}
      fullWidth
      disabled={props.disabled}
      required={props.required}
      error={!!props.rawErrors}
      id={props.id}
      value={props.value || ''}
      label={props.label}
      helperText={props.schema.description}
      margin="dense"
      onChange={(e) => props.onChange(e.target.value)}
    >
      {props.options.enumOptions.map(({ label, value }) => (
        <MenuItem key={value} value={value}>
          {label}
        </MenuItem>
      ))}
    </TextField>
  );
}

function FieldTemplate(props) {
  return (
    <div className={props.classNames}>
      {props.children}
      {props.errors}
    </div>
  );
}
/* eslint-enable react/prop-types */

class RunPage extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      isLoading,
    } = this.props;

    const widgets = {
      TextWidget,
      SelectWidget,
    };

    return (
      <div className={classes.container}>
        <DocumentTitle title="提交任务" />
        <Typography
          component="h1"
          variant="display2"
          gutterBottom
        >
          <span>提交任务</span>
        </Typography>
        <Paper className={classes.root}>
          <Form
            schema={schema}
            uiSchema={uiSchema}
            widgets={widgets}
            FieldTemplate={FieldTemplate}
            ArrayFieldTemplate={ArrayFieldTemplate}
            ObjectFieldTemplate={ObjectFieldTemplate}
            formData={undefined}
            onChange={console.log}
            onSubmit={console.log}
            onError={console.log}
          >
            <Button
              color="primary"
              variant="raised"
              type="submit"
            >
              直接提交
            </Button>
            <Button
              color="primary"
              variant="raised"
              type="submit"
            >
              暂存
            </Button>
            <Button
              color="secondary"
              onClick={this.handleReset}
            >
              重新填写
            </Button>
          </Form>
        </Paper>
      </div>
    );
  }
}

RunPage.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default compose(
  withStyles(styles),
)(RunPage);
