import 'index/typeface-noto-sans.css';
import 'typeface-roboto/index.css';

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
import { brown, teal } from 'material-ui/colors';
import { Switch, Route } from 'react-router-dom';
import NotFoundPage from 'components/NotFoundPage';
import ErrorBoundary from 'containers/ErrorBoundary';
import GlobalContainer from 'containers/GlobalContainer';
import LanguageProvider from 'containers/LanguageProvider';
import SnackbarContainer from 'containers/SnackbarContainer';
import SubscriptionContainer from 'containers/SubscriptionContainer';
import ChangePasswordContainer from 'containers/ChangePasswordContainer/Loadable';
import CreateBallotContainer from 'containers/CreateBallotContainer/Loadable';
import EditFieldsContainer from 'containers/EditFieldsContainer/Loadable';
import EditVotersContainer from 'containers/EditVotersContainer/Loadable';
import HomeContainer from 'containers/HomeContainer/Loadable';
import LoginContainer from 'containers/LoginContainer/Loadable';
import PreVotingContainer from 'containers/PreVotingContainer/Loadable';
import ViewBallotContainer from 'containers/ViewBallotContainer/Loadable';
import ViewStatContainer from 'containers/ViewStatContainer/Loadable';
import VoterRegContainer from 'containers/VoterRegContainer/Loadable';

import createHistory from 'history/createBrowserHistory';
import configureStore from 'utils/configureStore';
import { translationMessages as messages } from 'utils/i18n';

import './app.css';

// Create redux store with history
const initialState = {};
const history = createHistory();
const store = configureStore(initialState, history);
const MOUNT_NODE = document.getElementById('app');

const fonts = {
  en: '"Roboto", "Helvetica", "Arial", sans-serif',
  zh: '"Noto Sans SC X", "Noto Sans SC", "Microsoft YaHei", sans-serif',
};

const makeTheme = (fontFamily) => createMuiTheme({
  typography: {
    fontFamily,
  },
  palette: {
    primary: {
      light: teal[600],
      main: teal[800],
      dark: teal[900],
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

const ConnectedMuiThemeProvider = connect(createStructuredSelector({
  theme: createSelector(
    (state) => state.getIn(['language', 'locale']),
    (state) => makeTheme(fonts[state]),
  ),
}))(MuiThemeProvider);

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
        <LanguageProvider messages={messages}>
          <ConnectedRouter history={history}>
            <ErrorBoundary>
              <CssBaseline />
              <SubscriptionContainer />
              <ConnectedMuiThemeProvider>
                <GlobalContainer>
                  <ErrorBoundary>
                    <SnackbarContainer />
                    <ConnectedSwitch>
                      <Route exact path="/app/" component={HomeContainer} />
                      <Route exact path="/app/login" component={LoginContainer} />
                      <Route exact path="/app/password" component={ChangePasswordContainer} />
                      <Route exact path="/app/create" component={CreateBallotContainer} />
                      <Route exact path="/app/ballots/:bId" component={ViewBallotContainer} />
                      <Route exact path="/app/ballots/:bId/voters/" component={EditVotersContainer} />
                      <Route exact path="/app/ballots/:bId/fields/" component={EditFieldsContainer} />
                      <Route exact path="/app/vreg/:bId/:iCode" component={VoterRegContainer} />
                      <Route exact path="/app/ballots/:bId/preVoting" component={PreVotingContainer} />
                      <Route exact path="/app/ballots/:bId/tickets/" component={ViewStatContainer} />
                      <Route component={NotFoundPage} />
                    </ConnectedSwitch>
                  </ErrorBoundary>
                </GlobalContainer>
              </ConnectedMuiThemeProvider>
            </ErrorBoundary>
          </ConnectedRouter>
        </LanguageProvider>
      </ErrorBoundary>
    </Provider>,
    MOUNT_NODE,
  );
};

export const rerender = () => {
  ReactDOM.unmountComponentAtNode(MOUNT_NODE);
  render();
};
