import SDK, { SDKError } from '../';

describe('JSSDK', () => {
  const qc = new SDK({
    timeout: 1000,
    timeoutExclude: ['getDeviceInfo'],
  });

  window.webkit = { messageHandlers: { QCJSInterface: {} } };

  test('JSBridge 不支持', () => {
    return new Promise((resolve, reject) => {
      window.webkit.messageHandlers.QCJSInterface.postMessage = response => {
        const { method, callback } = response;
        SDK.cache[callback]({ code: 0, message: 'succesed' });
      };
      qc.call('getDeviceInfo')
        .then(resolve)
        .catch(error => {
          if (error instanceof SDKError && error.code === 100005) {
            resolve();
          }
          reject(error);
        });
    });
  });

  test('SDK 超时 timeout: 1000ms', () => {
    return new Promise((resolve, reject) => {
      window.webkit.messageHandlers.QCJSInterface.postMessage = response => {
        const { method, callback } = response;
        const timeout = method === 'getDeviceInfo' ? 3000 : 0;
        setTimeout(() => {
          SDK.cache[callback]({ code: 0, message: 'succesed' });
        }, timeout);
      };
      qc.call('getDeviceInfo')
        .then(resolve)
        .catch(error => {
          if (error instanceof SDKError && error.code === 100004) {
            resolve();
          }
          reject(error);
        });
    });
  });
});
