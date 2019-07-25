import {
  ERROR_NAME_EMPTY_CODE,
  ERROR_NAME_EMPTY_TEXT,
  ERROR_PARAMS_TYPE_CODE,
  ERROR_PARAMS_TYPE_TEXT,
  ERROR_JSBRIDGE_NOTSUPPORT_CODE,
  ERROR_JSBRIDGE_NOTSUPPORT_TEXT,
  ERROR_TIMEOUT_CODE,
  ERROR_TIMEOUT_TEXT,
  DEFAULT_TIMEOUT_EXCLUDE,
} from './constants';
import { isBrowser, isFunction, isPlainObject } from './utils';
import SDKError from './error';

export type IParams = any;
interface IOptions {
  debug?: boolean;
  timeout?: number;
  timeoutExclude?: string[];
  transformRequest?: any;
  transformResponse?: any;
  responseSuccessCode?: number;
  onError?: any;
}

interface IResponse {
  code?: number;
}

interface IConfig {
  callback?: string;
  callbackid?: string;
  method?: string;
  params?: IParams;
  data?: any;
}

function getJSBridge() {
  if (!isBrowser) return false;

  const iosBridge: any =
    window &&
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.QCJSInterface &&
    window.webkit.messageHandlers.QCJSInterface.postMessage
      ? window.webkit.messageHandlers.QCJSInterface.postMessage
      : false;

  if (isFunction(iosBridge)) {
    return (params: IParams) => {
      iosBridge(JSON.parse(JSON.stringify(params)));
    };
  }

  const androidBridge: any =
    window && window.QCJSInterface && window.QCJSInterface.callApp
      ? window.QCJSInterface.callApp
      : false;

  if (isFunction(androidBridge)) {
    return (params: IParams) => {
      androidBridge(JSON.stringify(params));
    };
  }

  return false;
}

function responseParse(value: any) {
  if (isPlainObject(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

const defaults: IOptions = {
  debug: false,
  timeout: 10000,
  timeoutExclude: DEFAULT_TIMEOUT_EXCLUDE,
  responseSuccessCode: 0,
};

const JSBridge: any = getJSBridge();

type ICache = { [key: string]: any };
type ITimer = { [key: string]: any };

class SDK {
  private id: number;
  options: IOptions;
  static cache: ICache = {};
  static timer: ITimer = {};
  constructor(options: IOptions) {
    this.id = 1;
    this.options = Object.assign(defaults, options);
  }
  // 创建临时 id
  protected callbackid(name: string): string {
    const time: number = +new Date();
    return ['JSBridge', name, time, ++this.id].join('_');
  }
  call(name: string, params: IParams): Promise<IResponse> {
    const {
      responseSuccessCode,
      timeout,
      timeoutExclude = [],
      transformRequest,
    }: IOptions = this.options;

    if (!name) {
      return Promise.reject(
        new SDKError(ERROR_NAME_EMPTY_TEXT, ERROR_NAME_EMPTY_CODE),
      );
    }

    if (params && !isPlainObject(params)) {
      return Promise.reject(
        new SDKError(ERROR_PARAMS_TYPE_TEXT, ERROR_PARAMS_TYPE_CODE),
      );
    }

    if (!isFunction(JSBridge)) {
      return Promise.reject(
        new SDKError(
          ERROR_JSBRIDGE_NOTSUPPORT_TEXT,
          ERROR_JSBRIDGE_NOTSUPPORT_CODE,
        ),
      );
    }

    return new Promise((resolve, reject) => {
      const id: string = this.callbackid(name);
      const config: IConfig = { method: name, params, callback: id };
      const { callback }: IParams = params || {};

      // JSSDK 超时处理
      if (!timeoutExclude.includes(name)) {
        SDK.timer[id] = setTimeout(() => {
          if (isFunction(SDK.cache[id])) {
            delete SDK.cache[id];
          }
          return reject(
            new SDKError(
              ERROR_TIMEOUT_TEXT.replace('%s', name),
              ERROR_TIMEOUT_CODE,
            ),
          );
        }, timeout);
      }
      // 创建 JSSDK 回调方法
      SDK.cache[id] = (source: string): any => {
        const response: IResponse = responseParse(source);
        // 释放 JSSDK 超时
        SDK.timer[id] && clearTimeout(SDK.timer[id]);
        // 执行参数回调
        isFunction(callback) && callback(response);
        // 执行 Promise 回调
        return (response.code === responseSuccessCode ? resolve : reject)(
          response,
        );
      };

      if (isFunction(transformRequest)) {
        config.params = transformRequest(config.params, name);
      }

      JSBridge(config);
    });
  }
  static track(name: string, params: IParams): Promise<IResponse> {
    return new SDK({}).call(name, params);
  }
  // 输入日志
  protected logger(message: any) {
    const time: string = new Date()
      .toTimeString()
      .replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');

    this.options.debug && console.log(`JSSDK [${time}]`, message);
  }

  // 客户端回调
  static appCallback(options: any) {
    const response = responseParse(options);
    const { callbackid, data: responseBody } = response;
    const callback = SDK.cache[callbackid];

    if (isFunction(callback)) {
      callback({ ...responseBody });
    }
  }
}

if (isBrowser) {
  // 老版本
  if (!window.QCJSAPI) {
    window.QCJSAPI = SDK;
  }
  if (!window.QCJSSDK) {
    window.QCJSSDK = SDK;
  }
}

export {
  SDKError,
  IConfig as SDKConfig,
  IOptions as SDKOptions,
  IParams as SDKParams,
  IResponse as SDKResponse,
};
export default SDK;
