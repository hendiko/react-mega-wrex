"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadingReducer = exports.storeReducer = void 0;
const utils_1 = require("./utils");
/** 核心 reduce 函数，实现状态的合并、重置、清空 */
const storeReducer = (state, action) => {
    const { type, payload } = action || {};
    // support three types which specify how to change sotre states.
    if (type === 'merge')
        return state === payload ? state : Object.assign(Object.assign({}, state), payload);
    if (type === 'reset')
        return ((0, utils_1.isPlainObject)(payload) ? payload : {});
    if (type === 'clear')
        return {};
    return state;
};
exports.storeReducer = storeReducer;
/** 更新异步 reduce 函数运行的 loading 状态 */
const loadingReducer = (state, action) => {
    const { type, name, count } = action;
    if (type === 'change' && state[name] !== !!count) {
        return Object.assign(Object.assign({}, state), { [name]: !!count });
    }
    return state;
};
exports.loadingReducer = loadingReducer;
