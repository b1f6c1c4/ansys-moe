import _ from 'lodash';

export const required = () => (value) => {
  if (value) return undefined;
  return '必填';
};

export const minChar = (m) => (value) => {
  if (value.length >= m) return undefined;
  return `至少${m}个字符`;
};

export const alphanumericDash = () => (value) => {
  if (/^[-a-zA-Z0-9]*$/.test(value)) return undefined;
  return '只能包括字母、数字、横线“-”';
};

export const properLines = () => (value) => {
  const lines = value.split('\n');
  if (!lines.every(_.identity)) return '不能包含空选项';
  if (_.uniq(lines).length !== lines.length) return '不能有重复选项';
  return undefined;
};

export const hexChar = () => (value) => {
  if (!value) return undefined;
  if (/^[0-9a-fA-F]*$/.test(value)) return undefined;
  return '只能包括十六进制数字0-9、a-f、A-F';
};

export default (...os) => os.map((o) => (v) => o(v));
