import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';

import TreeView from './treeview';

const render = () => {
  ReactDOM.render(
    <TreeView
      entries={[
        { key: '/', value: '1' },
        { key: '/a', value: '2' },
        { key: '/a/', value: '3' },
        { key: '/a/b', value: '4' },
        { key: '/a/b/c/d', value: '5' },
        { key: '/a/c/e', value: '6' },
        { key: '/a/f', value: '7' },
      ]}
    />,
    document.getElementById('root'),
  );
};

if (module.hot) {
  module.hot.accept(() => {
    render();
  });
}

render();
