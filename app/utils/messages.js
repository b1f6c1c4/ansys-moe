import { defineMessages } from 'react-intl';

export default defineMessages({
  globalTitle: {
    id: 'app.general.globalTitle',
    defaultMessage: 'Ballot',
  },
  login: {
    id: 'app.general.login',
    defaultMessage: 'Sign in',
  },
  register: {
    id: 'app.general.register',
    defaultMessage: 'Sign up',
  },
  cancel: {
    id: 'app.general.cancel',
    defaultMessage: 'Cancel',
  },
  beforeLeave: {
    id: 'app.general.beforeLeave',
    defaultMessage: 'Leave without save?',
  },
  // Field Type
  fieldType_StringField: {
    id: 'app.fieldType.StringField',
    defaultMessage: 'String',
  },
  fieldType_EnumField: {
    id: 'app.fieldType.EnumField',
    defaultMessage: 'Enum',
  },
  // Validation
  required: {
    id: 'app.validation.required',
    defaultMessage: 'Required.',
  },
  minChar: {
    id: 'app.validation.minChar',
    defaultMessage: 'At least {m} character(s).',
  },
  alphanumericDash: {
    id: 'app.validation.alphanumericDash',
    defaultMessage: 'Number, alphabet, or dash only.',
  },
  noEmptyLines: {
    id: 'app.validation.noEmptyLines',
    defaultMessage: 'No empty lines.',
  },
  noDupLines: {
    id: 'app.validation.DupLines',
    defaultMessage: 'No duplication values.',
  },
  hexChar: {
    id: 'app.validation.hexChar',
    defaultMessage: '0-9, a-f, A-F only.',
  },
  // Error
  error_unknown: {
    id: 'app.error.unknown',
    defaultMessage: 'Unknown error happened',
  },
  error_uath: {
    id: 'app.error.uath',
    defaultMessage: 'Unauthorzied',
  },
  error_ntfd: {
    id: 'app.error.ntfd',
    defaultMessage: 'Not found',
  },
  error_netw: {
    id: 'app.error.netw',
    defaultMessage: 'Network is bad',
  },
  error_unex: {
    id: 'app.error.unex',
    defaultMessage: 'Username exists',
  },
  error_wgup: {
    id: 'app.error.wgup',
    defaultMessage: 'Username and/or password incorrect',
  },
  error_wgpp: {
    id: 'app.error.wgpp',
    defaultMessage: 'Old password incorrect',
  },
  error_stna: {
    id: 'app.error.stna',
    defaultMessage: 'Ballot status incorrect',
  },
  error_tpns: {
    id: 'app.error.tpns',
    defaultMessage: 'Field type not supported',
  },
  error_nopk: {
    id: 'app.error.nopk',
    defaultMessage: 'Public key not found',
  },
  error_rpic: {
    id: 'app.error.rpic',
    defaultMessage: 'Ring parameter incorrect',
  },
  error_tmrq: {
    id: 'app.error.tmrq',
    defaultMessage: 'Too many requests',
  },
  error_unmf: {
    id: 'app.error.unmf',
    defaultMessage: 'Username malformed',
  },
  error_pwmf: {
    id: 'app.error.pwmf',
    defaultMessage: 'Password malformed',
  },
  error_nmmf: {
    id: 'app.error.nmmf',
    defaultMessage: 'Name malformed',
  },
  error_fdmf: {
    id: 'app.error.fdmf',
    defaultMessage: 'Field malformed',
  },
  error_pkmf: {
    id: 'app.error.pkmf',
    defaultMessage: 'Public key malformed',
  },
  error_vtrg: {
    id: 'app.error.vtrg',
    defaultMessage: 'Voter already registered',
  },
});
