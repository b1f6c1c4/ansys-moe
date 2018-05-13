import _ from 'lodash';
import { addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import zh from 'react-intl/locale-data/zh';
import * as rawResources from '../translations';

export const DEFAULT_LOCALE = 'zh'; // When can't find browser locale
export const ROOT_LOCALE = 'en'; // Fallback when there is no translation

export const appLocales = _.keys(rawResources).filter((k) => k !== 'default');

addLocaleData(en);
addLocaleData(zh);

export const translationMessages = _.mapValues(
  rawResources,
  /* istanbul ignore next */ (msg) => _.mergeWith(
    _.cloneDeep(msg),
    rawResources[ROOT_LOCALE],
    (obj, src) => (obj || src),
  ),
);
