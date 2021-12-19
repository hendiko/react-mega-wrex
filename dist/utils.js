"use strict";
/*
 * @Author: Xavier Yin
 * @Date: 2021-10-23 03:20:50
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loset = exports.loget = exports.isThenable = exports.isString = exports.isPlainObject = exports.isFunction = exports.isArray = void 0;
const isArray_1 = __importDefault(require("lodash/isArray"));
exports.isArray = isArray_1.default;
const isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
exports.isPlainObject = isPlainObject_1.default;
const get_1 = __importDefault(require("lodash/get"));
exports.loget = get_1.default;
const set_1 = __importDefault(require("lodash/set"));
exports.loset = set_1.default;
const isFunction = (fn) => typeof fn === 'function';
exports.isFunction = isFunction;
const isString = (str) => typeof str === 'string';
exports.isString = isString;
const isThenable = (thenable) => isFunction(thenable === null || thenable === void 0 ? void 0 : thenable.then);
exports.isThenable = isThenable;
