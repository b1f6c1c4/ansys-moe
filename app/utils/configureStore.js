/**
 * Create the store with dynamic reducers
 */

import _ from 'lodash';
import { createStore, applyMiddleware, compose } from 'redux';
import { fromJS } from 'immutable';
import { routerMiddleware } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import { createLogger } from 'redux-logger';
import persistState from 'redux-localstorage';

import createReducer from '../reducers';

const sagaMiddleware = createSagaMiddleware();

export const slicer = () => (rawState) => {
  let state = rawState.toJS();
  _.unset(state, 'language');
  _.unset(state, 'route');
  _.unset(state, 'preVotingContainer');
  _.unset(state, 'form.preVotingForm');

  const makeFilter = ({ reg, def = null }) => (o) => _.mapValues(o, (v, k) => {
    if (!reg.test(k)) return v;
    return def;
  });
  const filt = _.reduce([
    { reg: /^is.*Loading$/, def: false },
    { reg: /[Pp]rivateKey/ },
    { reg: /[Ee]rror/ },
  ], (fs, rg) => (o) => makeFilter(rg)(fs(o)), _.identity);

  function rm(v) {
    if (!_.isPlainObject(v)) return undefined;
    return _.mapValues(filt(v), (o) => _.cloneDeepWith(o, rm));
  }

  state = _.cloneDeepWith(state, rm);

  _.forIn(state.form, (form) => {
    const sens = _.keys(form.registeredFields).filter((k) => k.toLowerCase().includes('password'));
    sens.forEach((k) => _.unset(form, `values.${k}`));
  });

  return fromJS(state);
};

export default function configureStore(initialState = {}, history) {
  // Create the store with two middlewares
  // 1. sagaMiddleware: Makes redux-sagas work
  // 2. routerMiddleware: Syncs the location/URL path to the state
  // 3. logger: State transition log
  const middlewares = [
    sagaMiddleware,
    routerMiddleware(history),
  ];

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'test') {
    if (process.env.NODE_ENV !== 'production' || window.debug) {
      middlewares.push(createLogger({
        predicate: (getState, { type }) => !type || !type.startsWith('@@redux-form'),
        level: 'debug',
      }));
    }
  }

  const enhancers = [
    applyMiddleware(...middlewares),
  ];

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'test') {
    enhancers.push(persistState(undefined, {
      key: 'ballot',
      slicer,
      deserialize: /* istanbul ignore next */ (raw) => fromJS(JSON.parse(raw)),
      merge: /* istanbul ignore next */ (init, stat) => init.mergeDeep(stat),
    }));
  }

  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  /* eslint-disable no-underscore-dangle */
  const composeEnhancers =
    process.env.NODE_ENV !== 'production' &&
    typeof window === 'object' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'Ballot' })
      : compose;
  /* eslint-enable no-underscore-dangle */

  const store = createStore(
    createReducer(),
    fromJS(initialState),
    composeEnhancers(...enhancers),
  );

  // Extensions
  store.runSaga = sagaMiddleware.run;
  store.injectedSagas = {}; // Saga registry

  // Make reducers hot reloadable, see http://mxs.is/googmo
  /* istanbul ignore next */
  if (module.hot) {
    module.hot.accept('../reducers', () => {
      store.replaceReducer(createReducer());
    });
  }

  return store;
}
