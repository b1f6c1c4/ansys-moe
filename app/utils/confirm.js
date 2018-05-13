export default (intl, isPristineFunc) => () => {
  if (isPristineFunc()) return undefined;
  const msg = '离开之前不保存吗？';
  // eslint-disable-next-line no-alert
  return intl.formatMessage(msg);
};
