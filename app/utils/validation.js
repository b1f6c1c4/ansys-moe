import _ from 'lodash';
import messages from 'utils/messages';

export const required = () => (value) => {
  if (value) return undefined;
  return messages.required;
};

export const minChar = (m) => (value) => {
  if (value.length >= m) return undefined;
  return [messages.minChar, { m }];
};

export const alphanumericDash = () => (value) => {
  if (/^[-a-zA-Z0-9]*$/.test(value)) return undefined;
  return messages.alphanumericDash;
};

export const properLines = () => (value) => {
  const lines = value.split('\n');
  if (!lines.every(_.identity)) return messages.noEmptyLines;
  if (_.uniq(lines).length !== lines.length) return messages.noDupLines;
  return undefined;
};

export const hexChar = () => (value) => {
  if (!value) return undefined;
  if (/^[0-9a-fA-F]*$/.test(value)) return undefined;
  return messages.hexChar;
};

export default (intl, ...os) => os.map((o) => (v) => {
  const res = o(v);
  if (!res) return undefined;
  if (!Array.isArray(res)) return intl.formatMessage(res);
  return intl.formatMessage(...res);
});
