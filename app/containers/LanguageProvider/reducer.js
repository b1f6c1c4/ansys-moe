import _ from 'lodash';
import { fromJS } from 'immutable';
import browserLocale from 'browser-locale';
import { DEFAULT_LOCALE } from 'utils/i18n';

import * as LANGUAGE_PROVIDER from './constants';

function getLocale() {
  let locale = _.get(global, 'localStorage.i18nextLng') || browserLocale();
  if (locale) {
    [locale] = locale.split('-');
  } else {
    locale = DEFAULT_LOCALE;
  }
  return locale;
}

function languageProviderReducer(state = fromJS({ locale: getLocale() }), action) {
  switch (action.type) {
    case LANGUAGE_PROVIDER.CHANGE_LOCALE_ACTION:
      _.set(global, 'localStorage.i18nextLng', action.locale);
      return state
        .set('locale', action.locale);
    default:
      return state;
  }
}

export default languageProviderReducer;
