import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Typography,
} from 'material-ui';
import { Add, ArrowDropDown, ArrowDropUp, Delete } from '@material-ui/icons';
import Form from 'react-jsonschema-form';
import DocumentTitle from 'components/DocumentTitle';
import Button from 'components/Button';
import LoadingButton from 'components/LoadingButton';

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

function ArrayFieldTemplate(props) {
  const { classes } = props;
  const interleave = _.get(props, 'uiSchema.interleave', true);
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
            onClick={props.onAddClick}
          >
            <Add />
          </Button>
        </Grid>
        <Grid item xs={11}>
          <Typography variant={_.get(props, 'uiSchema.title')}>
            {props.title}
            <Typography component="span" variant="caption" className={classes.desc}>
              {props.description}
            </Typography>
          </Typography>
        </Grid>
      </Grid>
      {props.items.map((e, i) => (
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
  if (_.get(props, 'uiSchema.paper')) {
    return <Paper>{content}</Paper>;
  }
  return <div>{content}</div>;
}

const StyledArrayFieldTemplate = withStyles({
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
})(ArrayFieldTemplate);

function ObjectFieldTemplate(props) {
  const { classes } = props;
  const decideSize = (name) => {
    const size = _.get(props, ['uiSchema', name, 'size']);
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
    const type = _.get(props, ['schema', 'properties', name, 'type']);
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
      {(props.title || props.description) && (
        <Typography variant={_.get(props, 'uiSchema.title')}>
          {props.title}
          <Typography component="span" variant="caption" className={classes.desc}>
            {props.description}
          </Typography>
        </Typography>
      )}
      <Grid container spacing={8}>
        {props.properties.map((e) => (
          <Grid item key={e.content.key} {...decideSize(e.name)}>
            {e.content}
          </Grid>
        ))}
      </Grid>
    </React.Fragment>
  );
  const wrapper = _.get(props, 'uiSchema.padding', true)
    ? classes.wrapper
    : undefined;
  return <div className={wrapper}>{content}</div>;
}

const StyledObjectFieldTemplate = withStyles({
  wrapper: {
    padding: 8,
  },
  desc: {
    display: 'inline-block',
  },
})(ObjectFieldTemplate);
/* eslint-enable react/prop-types */

class RunPage extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      isLoading,
    } = this.props;

    const schema = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', title: '项目名称', description: '如果同名项目存在，则会覆盖之前的设置；如果不存在，会创建新项目' },
        config: {
          type: 'object',
          title: '项目设置',
          required: [
            'initEvals',
            'minEvals',
            'concurrent',
          ],
          properties: {
            initEvals: { type: 'integer', title: '初始迭代数', description: '每个分类在初始化后，采用实验设计方法，先作出初步尝试' },
            minEvals: { type: 'integer', title: '最少迭代数', description: '每个分类在达到最少迭代数之前不会尝试下一步迭代' },
            concurrent: { type: 'integer', title: '并发数', description: '每个分类最多同时进行的迭代数' },
            minEI: { type: 'number', title: '收敛条件', description: '最小目标函数增量期望' },
            D: {
              type: 'array',
              title: '设计变量',
              items: {
                type: 'object',
                required: ['name', 'kind'],
                properties: {
                  name: { type: 'string', title: '名称' },
                  kind: {
                    type: 'string',
                    enum: ['categorical', 'discrete', 'continuous'],
                    enumNames: ['分类', '离散', '连续'],
                    title: '类型',
                  },
                  condition: {
                    type: 'string',
                    title: '启动条件',
                    description: '满足什么条件（其他分类设计变量的表达式）时启用该变量',
                  },
                },
                dependencies: {
                  kind: {
                    oneOf: [{
                      required: ['steps'],
                      properties: {
                        kind: { enum: ['categorical'] },
                        steps: { type: 'integer', title: '分类数量' },
                      },
                    }, {
                      required: ['lowerBound', 'upperBound', 'steps'],
                      properties: {
                        kind: { enum: ['discrete'] },
                        lowerBound: { type: 'number', title: '最小值' },
                        upperBound: { type: 'number', title: '最大值' },
                        steps: { type: 'integer', title: '步数' },
                      },
                    }, {
                      required: ['lowerBound', 'upperBound', 'precision'],
                      properties: {
                        kind: { enum: ['continuous'] },
                        lowerBound: { type: 'number', title: '最小值' },
                        upperBound: { type: 'number', title: '最大值' },
                        precision: { type: 'number', title: '收敛精度' },
                      },
                    }],
                  },
                  condition: {
                    required: ['dependsOn'],
                    properties: {
                      dependsOn: {
                        type: 'array',
                        title: '该条件用到了哪些分类设计变量',
                        items: { type: 'string' },
                        description: '如果没有用到启动条件，留空即可',
                      },
                    },
                  },
                },
              },
            },
            G: {
              type: 'array',
              title: '几何参数',
              items: { $ref: '#/definitions/gepPar' },
            },
            ansys: {
              type: 'object',
              title: '仿真设置',
              description: '从上向下依次匹配；若都不匹配则会继续向后执行',
              required: ['rules'],
              properties: {
                rules: {
                  type: 'array',
                  title: '仿真规则',
                  items: {
                    type: 'object',
                    required: ['source', 'destination', 'onError'],
                    properties: {
                      source: { type: 'string', title: '源文件地址' },
                      destination: { type: 'string', title: '文件名' },
                      condition: { type: 'string', title: '启用条件', description: '可以输入设计变量和几何参数的表达式；留空表示强制匹配' },
                      inputs: {
                        type: 'array',
                        title: '仿真参数',
                        items: { $ref: '#/definitions/ansysInput' },
                      },
                      outputs: {
                        type: 'array',
                        title: '仿真结果',
                        items: { $ref: '#/definitions/ansysOutput' },
                      },
                      onError: {
                        type: 'string',
                        title: '错误处理',
                        enum: ['halt', 'ignore', 'default'],
                        enumNames: ['中止项目', '忽略并继续', '视作出界'],
                        default: 'halt',
                      },
                    },
                  },
                },
              },
            },
            E: {
              type: 'array',
              title: '电参数',
              items: { $ref: '#/definitions/gepPar' },
            },
            P: {
              type: 'array',
              title: '性能参数',
              items: { $ref: '#/definitions/gepPar' },
            },
            P0: {
              type: 'object',
              title: '目标函数',
              required: ['code'],
              properties: {
                default: { type: 'number', title: '默认值', description: '任意参数出界则使用该数值' },
                code: { type: 'string', title: '表达式' },
              },
            },
          },
        },
      },
      definitions: {
        gepPar: {
          type: 'object',
          required: ['name', 'kind', 'code'],
          properties: {
            name: { type: 'string', title: '名称' },
            kind: {
              type: 'string',
              title: '计算方式',
              enum: ['expression', 'mathematica', 'rlang'],
              enumNames: ['简单表达式', 'Mathematica语言表达式', 'R语言表达式'],
              default: 'expression',
            },
            code: { type: 'string', title: '表达式', description: '可以使用设计变量和前级任何参数；若要使用同级参数，需要在下方声明' },
            dependsOn: {
              type: 'array',
              title: '表达式中用到的同级参数',
              items: { type: 'string' },
            },
            lowerBound: { type: 'number', title: '下限', description: '若不满足约束，本次迭代中止，目标函数为默认值' },
            upperBound: { type: 'number', title: '上限', description: '若不满足约束，本次迭代中止，目标函数为默认值' },
          },
        },
        ansysInput: {
          type: 'object',
          required: ['name', 'variable'],
          properties: {
            name: { type: 'string', title: '名称', description: 'Ansys内部仿真参数名' },
            design: { type: 'string', title: '设计名称', description: '留空表示全局' },
            variable: { type: 'string', title: '变量名', description: '使用哪个设计变量或几何参数' },
          },
        },
        ansysOutput: {
          type: 'object',
          required: ['name', 'design', 'table', 'column'],
          properties: {
            name: { type: 'string', title: '名称', description: '保存结果的参数名称' },
            design: { type: 'string', title: '设计名称' },
            table: { type: 'string', title: '表格名称' },
            column: { type: 'integer', title: '列编号' },
            lowerBound: { type: 'number', title: '下限', description: '若不满足约束，本次迭代中止，目标函数为默认值' },
            upperBound: { type: 'number', title: '上限', description: '若不满足约束，本次迭代中止，目标函数为默认值' },
          },
        },
      },
    };

    const uiSchema = {
      name: { size: 12 },
      config: {
        title: 'headline',
        padding: false,
        initEvals: { size: 3 },
        minEvals: { size: 3 },
        concurrent: { size: 3 },
        minEI: { size: 3 },
        D: {
          title: 'headline',
          items: {
            name: { size: { xs: 12, sm: 6, md: 2 } },
            kind: { size: { xs: 12, sm: 6, md: 2 } },
            condition: { size: { xs: 12, sm: 12, md: 8 } },
          },
        },
        G: {
          title: 'headline',
          items: {
            code: { multiline: true, size: 12 },
          },
        },
        ansys: {
          title: 'subheading',
          padding: false,
          rules: {
            title: 'headline',
            items: {
              source: { size: { xs: 12, sm: 8, md: 8 } },
              destination: { size: { xs: 12, sm: 4, md: 4 } },
              condition: { size: 12 },
            },
          },
        },
        E: {
          title: 'headline',
          items: {
            code: { multiline: true, size: 12 },
          },
        },
        P: {
          title: 'headline',
          items: {
            code: { multiline: true, size: 12 },
          },
        },
        P0: {
          title: 'headline',
          code: { multiline: true, size: 12 },
        },
      },
    };

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
            ArrayFieldTemplate={StyledArrayFieldTemplate}
            ObjectFieldTemplate={StyledObjectFieldTemplate}
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
