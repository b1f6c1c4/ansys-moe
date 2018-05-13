import * as LANGUAGE_PROVIDER from './constants';

export function changeLocale(languageLocale) {
  return {
    type: LANGUAGE_PROVIDER.CHANGE_LOCALE_ACTION,
    locale: languageLocale,
  };
}
