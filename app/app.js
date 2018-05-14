import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { createStructuredSelector, createSelector } from 'reselect';

import {
  createMuiTheme,
  CssBaseline,
  MuiThemeProvider,
} from 'material-ui';
import { brown, indigo } from 'material-ui/colors';
import { Switch, Route } from 'react-router-dom';
import NotFoundPage from 'components/NotFoundPage';
import ErrorBoundary from 'containers/ErrorBoundary';
import GlobalContainer from 'containers/GlobalContainer';
import SubscriptionContainer from 'containers/SubscriptionContainer';
import HomeContainer from 'containers/HomeContainer/Loadable';
import ViewProjContainer from 'containers/ViewProjContainer/Loadable';
import ViewCatContainer from 'containers/ViewCatContainer/Loadable';
import ViewEvalContainer from 'containers/ViewEvalContainer/Loadable';

import createHistory from 'history/createBrowserHistory';
import configureStore from 'utils/configureStore';

import './app.css';

// Create redux store with history
const initialState = {};
const history = createHistory();
const store = configureStore(initialState, history);
const MOUNT_NODE = document.getElementById('app');

const theme = createMuiTheme({
  typography: {
    fontFamily: '"Microsoft YaHei", sans-serif',
  },
  palette: {
    primary: {
      light: indigo[600],
      main: indigo[800],
      dark: indigo[900],
      contrastText: '#fff',
    },
    secondary: {
      light: brown[600],
      main: brown[800],
      dark: brown[900],
      contrastText: '#fff',
    },
  },
});

const ConnectedSwitch = connect(createStructuredSelector({
  location: createSelector(
    (state) => state.getIn(['route', 'location']),
    (state) => state.toJS(),
  ),
}))(Switch);

export const render = () => {
  ReactDOM.render(
    <Provider store={store}>
      <ErrorBoundary>
        <ConnectedRouter history={history}>
          <ErrorBoundary>
            <CssBaseline />
            <SubscriptionContainer />
            <MuiThemeProvider theme={theme}>
              <GlobalContainer>
                <ErrorBoundary>
                  <ConnectedSwitch>
                    <Route exact path="/app/" component={HomeContainer} />
                    <Route exact path="/app/p/:proj" component={ViewProjContainer} />
                    <Route exact path="/app/p/:proj/cat/:cHash" component={ViewCatContainer} />
                    <Route exact path="/app/p/:proj/cat/:cHash/d/:dHash" component={ViewEvalContainer} />
                    <Route component={NotFoundPage} />
                  </ConnectedSwitch>
                </ErrorBoundary>
              </GlobalContainer>
            </MuiThemeProvider>
          </ErrorBoundary>
        </ConnectedRouter>
      </ErrorBoundary>
    </Provider>,
    MOUNT_NODE,
  );
};

export const rerender = () => {
  ReactDOM.unmountComponentAtNode(MOUNT_NODE);
  render();
};
