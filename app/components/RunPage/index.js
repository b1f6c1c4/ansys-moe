import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import {
  withStyles,
  Paper,
  Typography,
} from 'material-ui';
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

class RunPage extends React.PureComponent {
  render() {
    // eslint-disable-next-line no-unused-vars
    const {
      classes,
      isLoading,
    } = this.props;

    const schema = {
      title: '项目配置',
      type: 'object',
      required: [
        'initEval',
        'minEval',
        'concurrent',
      ],
      properties: {
        initEval: { type: 'integer', title: '每个分类初始迭代数（采用实验设计方法）' },
        minEval: { type: 'integer', title: '每个分类最少迭代数' },
        concurrent: { type: 'integer', title: '每个分类最多同时进行的迭代数' },
        minEI: { type: 'number', title: '收敛条件：目标函数最小增量期望' },
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
                title: '满足什么条件时启用该变量',
              },
            },
            dependencies: {
              kind: {
                oneOf: [{
                  required: ['steps'],
                  properties: {
                    kind: { enum: ['categorical'] },
                    steps: { type: 'integer', title: '类别数量' },
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
                  condition: { type: 'string', title: '满足什么条件时启用该规则' },
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
            default: { type: 'number', title: '默认值（任意参数出界则使用该数值）' },
            code: { type: 'string', title: '表达式' },
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
            code: { type: 'string', title: '表达式' },
            dependsOn: {
              type: 'array',
              title: '表达式中用到的同级参数',
              items: { type: 'string' },
            },
            lowerBound: { type: 'number', title: '下限' },
            upperBound: { type: 'number', title: '上限' },
          },
        },
        ansysInput: {
          type: 'object',
          required: ['name', 'variable'],
          properties: {
            name: { type: 'string', title: 'Ansys内部仿真参数名称' },
            design: { type: 'string', title: '设计名称（留空表示全局）' },
            variable: { type: 'string', title: '使用哪个设计变量或几何参数' },
          },
        },
        ansysOutput: {
          type: 'object',
          required: ['name', 'design', 'table', 'column'],
          properties: {
            name: { type: 'string', title: '保存结果的参数名称' },
            design: { type: 'string', title: '设计名称' },
            table: { type: 'string', title: '输出表格名称' },
            column: { type: 'integer', title: '列编号' },
            lowerBound: { type: 'number', title: '下限' },
            upperBound: { type: 'number', title: '上限' },
          },
        },
      },
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
            onChange={console.log}
            onSubmit={console.log}
            onError={console.log}
          />
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
