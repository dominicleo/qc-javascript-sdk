import qc, { SDKError, SDKParams } from 'qc-javascript-sdk';

qc.config({
  // 开启 Debug 模式
  debug: true,
  // 设置 SDK 超时时间
  timeout: 1000,
  // 设置 SDK 成功状态码
  responseSuccessCode: 200,
  transformRequest: (params: SDKParams, name: string) => {
    if (name === 'setNavigationMenu') {
      params.items = [];
    }
    return params;
  },
});

qc.call('getDeviceInfo');

async function init() {
  try {
    await qc.track('getDeviceInfo');
  } catch (error) {
    if (error instanceof SDKError) {
      // someting code
    }
  }
}
