import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'antd/dist/reset.css';
import { Provider } from 'react-redux';
import apiAddress from './Utils/API/apiAddress';
import { installGlobalErrorHandlers } from './Utils/errorReporter';
// import reportWebVitals from './reportWebVitals';

installGlobalErrorHandlers();

const container = document.getElementById('root');
if (!container) throw new Error('Root element is missing');

const showStartupError = () => {
  container.replaceChildren();
  const notice = document.createElement('p');
  notice.setAttribute('role', 'alert');
  notice.textContent =
    'Deployment configuration mismatch or unavailable application. Please contact the administrator. / 部署配置不匹配或应用无法加载，请联系管理员。';
  container.appendChild(notice);
};

try {
  apiAddress();
  void Promise.all([import('./App'), import('./Redux/Store')])
    .then(([{ default: App }, { store }]) => {
      createRoot(container).render(
        <Provider store={store}>
          <App />
        </Provider>,
      );
    })
    .catch(showStartupError);
} catch {
  showStartupError();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
