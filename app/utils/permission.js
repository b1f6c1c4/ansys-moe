export const CanEditFields = ({ status }) => {
  switch (status) {
    case 'creating':
    case 'inviting':
    case 'invited':
      return true;
    default:
      return false;
  }
};

export const CanEditVoters = ({ status }) => {
  switch (status) {
    case 'inviting':
      return true;
    default:
      return false;
  }
};

export const CanViewStats = ({ status }) => {
  switch (status) {
    case 'voting':
    case 'finished':
      return true;
    default:
      return false;
  }
};
