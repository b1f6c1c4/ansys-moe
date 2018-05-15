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
import JSON5 from 'json5';
import Form from 'react-jsonschema-form';
import ReactFileReader from 'react-file-reader';
import DocumentTitle from 'components/DocumentTitle';
import Button from 'components/Button';
import LoadingButton from 'components/LoadingButton';
import ArrayFieldTemplate from 'components/ArrayFieldTemplate';
import ObjectFieldTemplate from 'components/ObjectFieldTemplate';
import ResultIndicator from 'components/ResultIndicator';

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

const regularize = (v) => _.isNil(v) ? '' : v;

/* eslint-disable react/prop-types */
function TextWidget(props) {
  return (
    <TextField
      fullWidth
      multiline={_.get(props, 'uiSchema.multiline')}
      disabled={props.disabled}
      required={props.required}
      error={_.some(props.rawErrors, _.isString)}
      id={props.id}
      value={regularize(props.value)}
      label={props.label}
      helperText={props.schema.description}
      margin="dense"
      InputProps={{ style: { lineHeight: 'unset' } }}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

function SelectWidget(props) {
  return (
    <TextField
      select
      fullWidth
      disabled={props.disabled}
      required={props.required}
      error={_.some(props.rawErrors, _.isString)}
      id={props.id}
      value={regularize(props.value)}
      label={props.label}
      helperText={props.schema.description}
      margin="dense"
      SelectProps={{ style: { lineHeight: 'unset' } }}
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
  const errs = _.without(props.rawErrors, null);
  return (
    <div className={props.classNames}>
      {props.children}
      <ul>
        {errs.map((e) => (
          <li>{e}</li>
        ))}
      </ul>
    </div>
  );
}

function ErrorListTemplate(props) {
  return (
    <ul>
      {_.reject(props.errors, { name: null }).map((e) => (
        <li>{e.property} {e.message}</li>
      ))}
    </ul>
  );
}
/* eslint-enable react/prop-types */

function transformErrors(errors) {
  return _.map(errors, (e) => {
    switch (e.name) {
      case 'enum':
      case 'oneOf':
        _.set(e, 'name', null);
        _.set(e, 'message', null);
        break;
      case 'required':
        _.set(e, 'message', '必填');
        break;
      case 'type':
        switch (e.params.type) {
          case 'string':
            _.set(e, 'message', '必填');
            break;
          case 'number':
            _.set(e, 'message', '必须为实数');
            break;
          case 'integer':
            _.set(e, 'message', '必须为整数');
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    return e;
  });
}

class RunPage extends React.PureComponent {
  handleChange = ({ formData: { name, config } }) => this.props.onUploadAction(name || '', config);

  handleUpload = ([file]) => {
    const reader = new window.FileReader();
    reader.onload = () => {
      const config = JSON5.parse(reader.result);
      this.props.onUploadAction(undefined, config);
    };
    reader.readAsText(file);
  };

  handleDownload = () => {
    const text = JSON5.stringify(this.props.form.config, null, 2);
    const blob = new window.Blob([text], {
      type: 'application/json5',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.props.form.name || 'config'}.json5`;
    anchor.style.display = 'none';
    window.document.body.appendChild(anchor);
    setTimeout(() => {
      anchor.click();
      window.document.body.removeChild(anchor);
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    }, 0);
  };

  handleReset = () => this.props.onUploadAction(undefined, {});;

  handleSubmit = () => this.props.onRun();;

  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      isLoading,
      form,
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
        <div className={classes.actions}>
          <Button
            color="primary"
            onClick={this.handleDownload}
          >
            下载配置文件
          </Button>
          <ReactFileReader
            handleFiles={this.handleUpload}
            fileTypes={['.json', '.json5']}
          >
            <Button color="primary">
              上传配置文件
            </Button>
          </ReactFileReader>
          <Button
            color="secondary"
            onClick={this.handleReset}
          >
            重新填写
          </Button>
        </div>
        <Paper className={classes.root}>
          <Form
            schema={schema}
            uiSchema={uiSchema}
            widgets={widgets}
            ArrayFieldTemplate={ArrayFieldTemplate}
            ObjectFieldTemplate={ObjectFieldTemplate}
            FieldTemplate={FieldTemplate}
            ErrorList={ErrorListTemplate}
            formData={form}
            liveValidate
            onChange={this.handleChange}
            onSubmit={this.handleSubmit}
            transformErrors={transformErrors}
          >
            <div className={classes.actions}>
              <LoadingButton {...{ isLoading }}>
                <Button
                  color="primary"
                  variant="raised"
                  type="submit"
                  disabled={isLoading}
                >
                  直接提交
                </Button>
              </LoadingButton>
            </div>
            <ResultIndicator error={this.props.error} />
          </Form>
        </Paper>
      </div>
    );
  }
}

RunPage.propTypes = {
  classes: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  form: PropTypes.object,
  error: PropTypes.object,
  onRun: PropTypes.func.isRequired,
  onUploadAction: PropTypes.func.isRequired,
};

export default compose(
  withStyles(styles),
)(RunPage);
