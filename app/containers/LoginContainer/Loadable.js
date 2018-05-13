import makeLoadable from 'utils/makeLoadable';

export default makeLoadable({
  loader: () => import(/* webpackChunkName: "LoginContainer" */ './index'),
});
