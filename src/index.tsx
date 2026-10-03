import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'antd/dist/reset.css';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './Redux/Store';
import { installGlobalErrorHandlers } from './Utils/errorReporter';
// import reportWebVitals from './reportWebVitals';

installGlobalErrorHandlers();

const container = document.getElementById('root');
if (!container) throw new Error('Root element is missing');

createRoot(container).render(
  // <React.StrictMode>
  <Provider store={store}>
    <App />
  </Provider>,
  // </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
