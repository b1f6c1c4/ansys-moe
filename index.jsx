import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';

import { Button } from 'material-ui/es';

const render = () => {
  ReactDOM.render(
    <Button />,
    document.getElementById('root'),
  );
};

if (module.hot) {
  module.hot.accept(() => {
    render();
  });
}

render();
