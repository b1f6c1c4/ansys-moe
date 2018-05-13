import messages from './messages';

export default (intl, isPristineFunc) => () => {
  if (isPristineFunc()) return undefined;
  const msg = messages.beforeLeave;
  // eslint-disable-next-line no-alert
  return intl.formatMessage(msg);
};
