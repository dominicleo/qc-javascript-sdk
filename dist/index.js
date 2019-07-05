(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) :
(global = global || self, factory(global.JSSDK = {}));
}(this, function (exports) { 'use strict';

const ERROR_NAME_EMPTY_CODE = 100003;
const ERROR_NAME_EMPTY_TEXT = '请确认 JSSDK 名称.';
const ERROR_TIMEOUT_CODE = 100004;
const ERROR_TIMEOUT_TEXT = 'JSSDK %s 响应超时';
const ERROR_JSBRIDGE_NOTSUPPORT_CODE = 100005;
const ERROR_JSBRIDGE_NOTSUPPORT_TEXT = 'JSBridge 不受支持.';
const ERROR_PARAMS_TYPE_CODE = 100006;
const ERROR_PARAMS_TYPE_TEXT = '请确认 JSSDK 参数类型';
const DEFAULT_TIMEOUT_EXCLUDE = [
    'Moxiecert',
    'watchShake',
    'jump',
    'faceplusplus',
    'getAccessToken',
    'registerCallback',
    'resumeEvent',
    'uploadImage',
    'getWldData',
];

const isBrowser = typeof window !== 'undefined';
function isFunction(value) {
    return value instanceof Function;
}
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
}

class SDKError extends Error {
    constructor(message, code) {
        super(message);
        this.code = null;
        this.name = 'SDKError';
        this.message = message;
        code && (this.code = code);
    }
}

const defaults = {
    debug: false,
    timeout: 10000,
    timeoutExclude: DEFAULT_TIMEOUT_EXCLUDE,
    responseSuccessCode: 0,
};
function getJSBridge() {
    if (!isBrowser)
        return false;
    const iosBridge = window &&
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.QCJSInterface &&
        window.webkit.messageHandlers.QCJSInterface.postMessage
        ? window.webkit.messageHandlers.QCJSInterface.postMessage
        : false;
    if (isFunction(iosBridge)) {
        return (params) => {
            iosBridge(JSON.parse(JSON.stringify(params)));
        };
    }
    const androidBridge = window && window.QCJSInterface && window.QCJSInterface.callApp
        ? window.QCJSInterface.callApp
        : false;
    if (isFunction(androidBridge)) {
        return (params) => {
            androidBridge(JSON.stringify(params));
        };
    }
    return false;
}
function responseParse(value) {
    if (isPlainObject(value))
        return value;
    try {
        return JSON.parse(value);
    }
    catch {
        return {};
    }
}
class SDK {
    constructor(options) {
        this.id = 1;
        this.options = defaults;
        this.options = Object.assign(this.options, SDK.defaults, options);
    }
    call(name, params) {
        const { responseSuccessCode, timeout, timeoutExclude = [], transformRequest, } = this.options;
        const JSBridge = getJSBridge();
        if (!name) {
            return Promise.reject(new SDKError(ERROR_NAME_EMPTY_TEXT, ERROR_NAME_EMPTY_CODE));
        }
        if (params && !isPlainObject(params)) {
            return Promise.reject(new SDKError(ERROR_PARAMS_TYPE_TEXT, ERROR_PARAMS_TYPE_CODE));
        }
        if (!isFunction(JSBridge)) {
            return Promise.reject(new SDKError(ERROR_JSBRIDGE_NOTSUPPORT_TEXT, ERROR_JSBRIDGE_NOTSUPPORT_CODE));
        }
        return new Promise((resolve, reject) => {
            const id = this.callbackid(name);
            const config = { method: name, params, callback: id };
            const { callback } = params || {};
            // JSSDK 超时处理
            if (!timeoutExclude.includes(name)) {
                SDK.timer[id] = setTimeout(() => {
                    if (isFunction(SDK.cache[id])) {
                        delete SDK.cache[id];
                    }
                    return reject(new SDKError(ERROR_TIMEOUT_TEXT.replace('%s', name), ERROR_TIMEOUT_CODE));
                }, timeout);
            }
            // 创建 JSSDK 回调方法
            SDK.cache[id] = (source) => {
                const response = responseParse(source);
                // 释放 JSSDK 超时
                SDK.timer[id] && clearTimeout(SDK.timer[id]);
                // 执行参数回调
                isFunction(callback) && callback(response);
                // 执行 Promise 回调
                return (response.code === responseSuccessCode ? resolve : reject)(response);
            };
            if (isFunction(transformRequest)) {
                config.params = transformRequest(config.params, name);
            }
            JSBridge(config);
        });
    }
    // 兼容老版本 JSSDK
    track(name, params) {
        return new SDK().call(name, params);
    }
    // 创建临时 id
    callbackid(name) {
        const time = +new Date();
        return ['JSSDK', name, time, ++this.id].join('_');
    }
    // 输入日志
    logger(message) {
        const time = new Date()
            .toTimeString()
            .replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
        this.options.debug && console.log(`JSSDK [${time}]`, message);
    }
    // 客户端回调
    static appCallback(options) {
        const response = responseParse(options);
        const { callbackid, data: responseBody } = response;
        const callback = SDK.cache[callbackid];
        if (isFunction(callback)) {
            callback({ ...responseBody });
        }
    }
}
SDK.defaults = defaults;
SDK.cache = {};
SDK.timer = {};
if (isBrowser) {
    // 老版本
    if (!window.QCJSAPI) {
        window.QCJSAPI = SDK;
    }
    if (!window.QCJSSDK) {
        window.QCJSSDK = SDK;
    }
}

exports.SDKError = SDKError;
exports.default = SDK;

Object.defineProperty(exports, '__esModule', { value: true });

}));
