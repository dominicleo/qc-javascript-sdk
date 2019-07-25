'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var ERROR_NAME_EMPTY_CODE = 100003;
var ERROR_NAME_EMPTY_TEXT = '请确认 JSSDK 名称.';
var ERROR_TIMEOUT_CODE = 100004;
var ERROR_TIMEOUT_TEXT = 'JSSDK %s 响应超时';
var ERROR_JSBRIDGE_NOTSUPPORT_CODE = 100005;
var ERROR_JSBRIDGE_NOTSUPPORT_TEXT = 'JSBridge 不受支持.';
var ERROR_PARAMS_TYPE_CODE = 100006;
var ERROR_PARAMS_TYPE_TEXT = '请确认 JSSDK 参数类型';
var DEFAULT_TIMEOUT_EXCLUDE = [
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

var isBrowser = typeof window !== 'undefined';
function isFunction(value) {
    return value instanceof Function;
}
function isPlainObject(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    var proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
}

var SDKError = /** @class */ (function (_super) {
    __extends(SDKError, _super);
    function SDKError(message, code) {
        var _this = _super.call(this, message) || this;
        _this.code = null;
        _this.name = 'SDKError';
        _this.message = message;
        code && (_this.code = code);
        return _this;
    }
    return SDKError;
}(Error));

function getJSBridge() {
    if (!isBrowser)
        return false;
    var iosBridge = window &&
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.QCJSInterface &&
        window.webkit.messageHandlers.QCJSInterface.postMessage
        ? window.webkit.messageHandlers.QCJSInterface.postMessage
        : false;
    if (isFunction(iosBridge)) {
        return function (params) {
            iosBridge(JSON.parse(JSON.stringify(params)));
        };
    }
    var androidBridge = window && window.QCJSInterface && window.QCJSInterface.callApp
        ? window.QCJSInterface.callApp
        : false;
    if (isFunction(androidBridge)) {
        return function (params) {
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
    catch (_a) {
        return {};
    }
}
var defaults = {
    debug: false,
    timeout: 10000,
    timeoutExclude: DEFAULT_TIMEOUT_EXCLUDE,
    responseSuccessCode: 0,
};
var JSBridge = getJSBridge();
var SDK = /** @class */ (function () {
    function SDK(options) {
        this.id = 1;
        this.options = Object.assign(defaults, options);
    }
    // 创建临时 id
    SDK.prototype.callbackid = function (name) {
        var time = +new Date();
        return ['JSBridge', name, time, ++this.id].join('_');
    };
    SDK.prototype.call = function (name, params) {
        var _this = this;
        var _a = this.options, responseSuccessCode = _a.responseSuccessCode, timeout = _a.timeout, _b = _a.timeoutExclude, timeoutExclude = _b === void 0 ? [] : _b, transformRequest = _a.transformRequest;
        if (!name) {
            return Promise.reject(new SDKError(ERROR_NAME_EMPTY_TEXT, ERROR_NAME_EMPTY_CODE));
        }
        if (params && !isPlainObject(params)) {
            return Promise.reject(new SDKError(ERROR_PARAMS_TYPE_TEXT, ERROR_PARAMS_TYPE_CODE));
        }
        if (!isFunction(JSBridge)) {
            return Promise.reject(new SDKError(ERROR_JSBRIDGE_NOTSUPPORT_TEXT, ERROR_JSBRIDGE_NOTSUPPORT_CODE));
        }
        return new Promise(function (resolve, reject) {
            var id = _this.callbackid(name);
            var config = { method: name, params: params, callback: id };
            var callback = (params || {}).callback;
            // JSSDK 超时处理
            if (!timeoutExclude.includes(name)) {
                SDK.timer[id] = setTimeout(function () {
                    if (isFunction(SDK.cache[id])) {
                        delete SDK.cache[id];
                    }
                    return reject(new SDKError(ERROR_TIMEOUT_TEXT.replace('%s', name), ERROR_TIMEOUT_CODE));
                }, timeout);
            }
            // 创建 JSSDK 回调方法
            SDK.cache[id] = function (source) {
                var response = responseParse(source);
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
    };
    SDK.track = function (name, params) {
        return new SDK({}).call(name, params);
    };
    // 输入日志
    SDK.prototype.logger = function (message) {
        var time = new Date()
            .toTimeString()
            .replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
        this.options.debug && console.log("JSSDK [" + time + "]", message);
    };
    // 客户端回调
    SDK.appCallback = function (options) {
        var response = responseParse(options);
        var callbackid = response.callbackid, responseBody = response.data;
        var callback = SDK.cache[callbackid];
        if (isFunction(callback)) {
            callback(__assign({}, responseBody));
        }
    };
    SDK.cache = {};
    SDK.timer = {};
    return SDK;
}());
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
