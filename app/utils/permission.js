export const CanStop = ({ status }) => {
  switch (status) {
    case 'running':
      return true;
    default:
      return false;
  }
};

export const CanDrop = ({ status }) => {
  switch (status) {
    case 'error':
    case 'done':
      return true;
    default:
      return false;
  }
};
