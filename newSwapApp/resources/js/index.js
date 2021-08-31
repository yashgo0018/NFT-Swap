require('./bootstrap');
import ReactDom from 'react-dom';
import App from './app';

if (document.getElementById('app'))
  ReactDom.render(<App />, document.getElementById('app'));
