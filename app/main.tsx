import { render } from 'preact';
import { App } from './core/App.tsx';
import './core/base.css';

render(<App />, document.getElementById('app')!);

if (!import.meta.env.DEV && 'serviceWorker' in navigator)
  navigator.serviceWorker.register('./sw.js');
