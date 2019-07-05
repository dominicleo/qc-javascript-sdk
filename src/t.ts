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

// interface ISDK {
//   id: number;
//   cache: object;
//   timer: object;
//   options: any;
// }

// interface IOptions {
//   debug?: boolean;
//   successCode?: number;
//   onError?: any;
//   timeout: number;
//   timeoutExclude?: string[];
//   transformRequest?: any;
//   transformResponse?: any;
// }

// interface IResponse {
//   code?: number;
//   data?: object;
//   message?: string;
// }

// interface IConfig {
//   method: string;
//   params?: any;
//   callback: string;
// }

// function getJSBridge() {
//   if (!isBrowser) return false;

//   const iosBridge: any =
//     window &&
//     window.webkit &&
//     window.webkit.messageHandlers &&
//     window.webkit.messageHandlers.QCJSInterface &&
//     window.webkit.messageHandlers.QCJSInterface.postMessage
//       ? window.webkit.messageHandlers.QCJSInterface.postMessage
//       : false;

//   if (isFunction(iosBridge)) {
//     return (params: any): void => {
//       iosBridge(JSON.parse(JSON.stringify(params)));
//     };
//   }

//   const androidBridge: any =
//     window && window.QCJSInterface && window.QCJSInterface.callApp
//       ? window.QCJSInterface.callApp
//       : false;

//   if (isFunction(androidBridge)) {
//     return (params: any): void => {
//       androidBridge(JSON.stringify(params));
//     };
//   }

//   return false;
// }

// const defaults: IOptions = {
//   debug: false,
//   successCode: 0,
//   onError: null,
//   timeout: 0,
//   timeoutExclude: DEFAULT_TIMEOUT_EXCLUDE,
//   transformRequest: null,
//   transformResponse: null,
// };

// class JSSDK<ISDK> {
//   id = 1;
//   static cache: { [key: string]: any } = {};
//   static timer: { [key: string]: any } = {};
//   options = defaults;
//   constructor(options: IOptions) {
//     this.logger('register succeed.');
//     this.options = Object.assign({}, this.options, options);
//   }

//   call(name: string, params: any): Promise<IResponse> {
//     const {
//       successCode,
//       timeout,
//       timeoutExclude = [],
//       transformRequest,
//     }: IOptions = this.options;
//     const JSBridge: any = getJSBridge();

//     if (!name) {
//       return Promise.reject(
//         new SDKError(ERROR_NAME_EMPTY_TEXT, ERROR_NAME_EMPTY_CODE),
//       );
//     }

//     if (!(params instanceof Object)) {
//       return Promise.reject(
//         new SDKError(ERROR_PARAMS_TYPE_TEXT, ERROR_PARAMS_TYPE_CODE),
//       );
//     }

//     if (!isFunction(JSBridge)) {
//       return Promise.reject(
//         new SDKError(
//           ERROR_JSBRIDGE_NOTSUPPORT_TEXT,
//           ERROR_JSBRIDGE_NOTSUPPORT_CODE,
//         ),
//       );
//     }

//     return new Promise((resolve, reject) => {
//       const id: string = this.callbackid(name);
//       const config: IConfig = { method: name, params, callback: id };
//       const { callback } = params;

//       // JSSDK 超时处理
//       if (!timeoutExclude.includes(name)) {
//         JSSDK.timer[id] = setTimeout(() => {
//           if (isFunction(JSSDK.cache[id])) {
//             delete JSSDK.cache[id];
//           }
//           return reject(
//             new SDKError(
//               ERROR_TIMEOUT_TEXT.replace('%s', name),
//               ERROR_TIMEOUT_CODE,
//             ),
//           );
//         }, timeout);
//       }

//       // 创建 JSSDK 回调方法
//       JSSDK.cache[id] = (source: string): any => {
//         const response: IResponse = responseParse(source);
//         // 释放 JSSDK 超时
//         JSSDK.timer[id] && clearTimeout(JSSDK.timer[id]);
//         // 执行参数回调
//         isFunction(callback) && callback(response);
//         // 执行 Promise 回调
//         return (response.code === successCode ? resolve : reject)(response);
//       };

//       if (isFunction(transformRequest)) {
//         config.params = transformRequest(config.params, name);
//       }

//       JSBridge(config);
//     });
//   }

//   // 兼容老版本 JSSDK
//   track(name: string, params: any): Promise<IResponse> {
//     return this.call(name, params);
//   }

//   // 创建临时 id
//   protected callbackid(name: string): string {
//     const time: number = +new Date();
//     return ['JSSDK', name, time, ++this.id].join('_');
//   }

//   // 输入日志
//   protected logger(message: any) {
//     const time: string = new Date()
//       .toTimeString()
//       .replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');

//     this.options.debug && console.log(`JSSDK [${time}]`, message);
//   }

//   // 客户端回调
//   static appCallback(options: any) {
//     const response = responseParse(options);
//     const { callbackid, data: responseBody } = response;
//     const callback = this.cache[callbackid];

//     if (isFunction(callback)) {
//       callback({...responseBody});
//     }
//   }
// }

// if (isBrowser) {
//   // 老版本
//   if (!window.QCJSAPI) {
//     window.QCJSAPI = JSSDK;
//   }
//   if (!window.QCJSSDK) {
//     window.QCJSSDK = JSSDK;
//   }
// }

// export default JSSDK;

// let timeoutExclude: any = DEFAULT_TIMEOUT_EXCLUDE;
// let transformRequest: any = [];
// let transformResponse: any = [];

// interface IConfig {
//   debug?: boolean;
//   successCode?: number;
//   onError?: any;
//   timeout: number;
//   timeoutExclude?: string[];
//   transformRequest?: any;
//   transformResponse?: any;
// }

// const config: IConfig = {
//   successCode: 0,
//   timeout: 10000,
//   timeoutExclude: DEFAULT_TIMEOUT_EXCLUDE,
// };

// interface IResponse {
//   code?: number;
//   data?: object;
//   message?: string;
// }

// type Track = (name: string, params: any) => Promise<IResponse>;
// type AppCallback = (response: any) => void;

// interface ISDK {
//   cache: { [key: string]: any };
//   timer: { [key: string]: any };
//   config: IConfig;
//   call: Track;
//   appCallback: AppCallback;
// }

// function responseParse(value: any) {
//   if (isPlainObject(value)) return value;

//   try {
//     return JSON.parse(value);
//   } catch {
//     return {};
//   }
// }

// function logger(message: any) {
//   const time: string = new Date()
//     .toTimeString()
//     .replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');

//   config.debug && console.log(`JSSDK [${time}]`, message);
// }

// const JSSDK: ISDK = {
//   cache: {},
//   timer: {},
//   call(name: string, params: any) {
//     const JSBridge = 1;

//     if (!name) {
//       return Promise.reject(
//         new SDKError(ERROR_NAME_EMPTY_TEXT, ERROR_NAME_EMPTY_CODE),
//       );
//     }

//     if (!(params instanceof Object)) {
//       return Promise.reject(
//         new SDKError(ERROR_PARAMS_TYPE_TEXT, ERROR_PARAMS_TYPE_CODE),
//       );
//     }

//     if (!isFunction(JSBridge)) {
//       return Promise.reject(
//         new SDKError(
//           ERROR_JSBRIDGE_NOTSUPPORT_TEXT,
//           ERROR_JSBRIDGE_NOTSUPPORT_CODE,
//         ),
//       );
//     }

//     return new Promise((resolve, reject) => {
//       const id: string = this.callbackid(name);
//       const config: IConfig = { method: name, params, callback: id };
//       const { callback } = params;

//       // JSSDK 超时处理
//       if (!timeoutExclude.includes(name)) {
//         JSSDK.timer[id] = setTimeout(() => {
//           if (isFunction(JSSDK.cache[id])) {
//             delete JSSDK.cache[id];
//           }
//           return reject(
//             new SDKError(
//               ERROR_TIMEOUT_TEXT.replace('%s', name),
//               ERROR_TIMEOUT_CODE,
//             ),
//           );
//         }, timeout);
//       }

//       // 创建 JSSDK 回调方法
//       JSSDK.cache[id] = (source: string): any => {
//         const response: IResponse = responseParse(source);
//         // 释放 JSSDK 超时
//         JSSDK.timer[id] && clearTimeout(JSSDK.timer[id]);
//         // 执行参数回调
//         isFunction(callback) && callback(response);
//         // 执行 Promise 回调
//         return (response.code === successCode ? resolve : reject)(response);
//       };

//       if (isFunction(transformRequest)) {
//         config.params = transformRequest(config.params, name);
//       }

//       JSBridge(config);
//     });
//   },

//   appCallback(options) {
//     const response = responseParse(options);
//     const { callbackid, data: responseBody } = response;
//     const callback = cache[callbackid];
//     const { transformResponse } = config;

//     if (isFunction(callback)) {
//       callback(
//         isFunction(transformResponse)
//           ? transformResponse(responseBody)
//           : responseBody,
//       );
//     }
//   },
// };

// if (isBrowser) {
//   // 老版本
//   if (!window.QCJSAPI) {
//     window.QCJSAPI = JSSDK;
//   }
//   if (!window.QCJSSDK) {
//     window.QCJSSDK = JSSDK;
//   }
// }

// export default JSSDK;
