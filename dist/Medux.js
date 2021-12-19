"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMedux = exports.createMedux = exports.connect = void 0;
/*
 * @Author: Xavier Yin
 * @Date: 2021-11-24 11:27:23
 */
const react_1 = __importStar(require("react"));
const MeduxContext_1 = __importStar(require("./MeduxContext"));
const utils_1 = require("./utils");
const useMeduxStore_1 = __importDefault(require("./useMeduxStore"));
// 转换 connect 的参数为统一格式
const transformConnectMappingArg = (obj) => {
    if ((0, utils_1.isPlainObject)(obj))
        return Object.keys(obj).map((key) => [key, obj[key]]);
    if ((0, utils_1.isFunction)(obj))
        return obj;
    // 仅支持 Array<string> 类型的数据
    if ((0, utils_1.isArray)(obj))
        return obj.reduce((arr, item) => {
            if ((0, utils_1.isString)(item))
                arr.push([item, item]);
            return arr;
        }, []);
    if ((0, utils_1.isString)(obj))
        return [obj, obj];
    return undefined;
};
// 作为 props 必须是一个 Plain Object
const validateProps = (obj) => ((0, utils_1.isPlainObject)(obj) ? obj : {});
const Medux = react_1.default.memo((props) => {
    const { store, context = MeduxContext_1.default, children } = props;
    return react_1.default.createElement(context.Provider, { value: store }, children);
});
Medux.displayName = 'Medux';
// 连接到 Medux 上下文
const connect = (mapStateToProps, mapDispatchToProps, mapLoadingToProps, options) => {
    // 支持 map 参数是字符串、字符串数组、对象、函数
    mapStateToProps = transformConnectMappingArg(mapStateToProps);
    mapDispatchToProps = transformConnectMappingArg(mapDispatchToProps);
    mapLoadingToProps = transformConnectMappingArg(mapLoadingToProps);
    return (Comp) => {
        const MemoedComp = react_1.default.memo(Comp);
        return react_1.default.memo((props) => {
            const { context } = options || {};
            const { state, dispatch, loading } = (0, MeduxContext_1.useMeduxContext)(context) || {};
            const propsFromState = (0, react_1.useMemo)(() => {
                if ((0, utils_1.isFunction)(mapStateToProps)) {
                    return validateProps(mapStateToProps(state, props, {
                        state,
                        dispatch,
                    }));
                }
                if ((0, utils_1.isArray)(mapStateToProps)) {
                    return mapStateToProps.reduce((acc, [key, path]) => {
                        acc[key] = dispatch === null || dispatch === void 0 ? void 0 : dispatch.getState(path);
                        return acc;
                    }, {});
                }
                return {};
            }, [state, dispatch, props]);
            const propsFromDispatch = (0, react_1.useMemo)(() => {
                if ((0, utils_1.isFunction)(mapDispatchToProps)) {
                    return validateProps(mapDispatchToProps(dispatch, props, { state, dispatch }));
                }
                if ((0, utils_1.isArray)(mapDispatchToProps)) {
                    return mapDispatchToProps.reduce((acc, [key, name]) => {
                        acc[key] = dispatch === null || dispatch === void 0 ? void 0 : dispatch[name];
                        return acc;
                    }, {});
                }
                return {};
            }, [state, dispatch, props]);
            const propsFromLoading = (0, react_1.useMemo)(() => {
                if ((0, utils_1.isFunction)(mapLoadingToProps)) {
                    return validateProps(mapLoadingToProps(loading, props));
                }
                // 支持多个 reducer loading 联合判断，只要有一个处于 loading 状态，则视为联合 loading 状态为真。
                if ((0, utils_1.isArray)(mapLoadingToProps)) {
                    return mapLoadingToProps.reduce((acc, [key, name]) => {
                        acc[key] = (0, utils_1.isArray)(name)
                            ? name.reduce((bool, item) => bool || (loading === null || loading === void 0 ? void 0 : loading[item]), false)
                            : loading === null || loading === void 0 ? void 0 : loading[name];
                        return acc;
                    }, {});
                }
                return {};
            }, [loading, props]);
            return (react_1.default.createElement(MemoedComp, Object.assign({}, props, propsFromState, propsFromDispatch, propsFromLoading)));
        });
    };
};
exports.connect = connect;
// 创建一个提供了 Medux Store 上下文的高阶函数
const createMedux = (reducers, initialState, init, options) => (Comp) => react_1.default.memo((props) => {
    const { context = MeduxContext_1.default } = options || {};
    const [store] = (0, useMeduxStore_1.default)(reducers, initialState, init);
    return (react_1.default.createElement(Medux, { store: store, context: context },
        react_1.default.createElement(Comp, Object.assign({}, props))));
});
exports.createMedux = createMedux;
// 返回已绑定上下文的方法
const withMedux = (options) => {
    const { context = react_1.default.createContext({}) } = options || {};
    const _connect = (mapStateToProps, mapDispatchToProps, mapLoadingToProps, options) => connect(mapStateToProps, mapDispatchToProps, mapLoadingToProps, Object.assign(Object.assign({}, options), { context }));
    const _createMedux = (reducers, initialState, init, options) => createMedux(reducers, initialState, init, Object.assign(Object.assign({}, options), { context }));
    const _useMeduxContext = () => (0, MeduxContext_1.useMeduxContext)(context);
    return {
        connect: _connect,
        context,
        createMedux: _createMedux,
        useMeduxContext: _useMeduxContext,
    };
};
exports.withMedux = withMedux;
exports.default = Medux;
