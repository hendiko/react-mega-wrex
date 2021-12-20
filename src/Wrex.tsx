/*
 * @Author: Xavier Yin
 * @Date: 2021-11-24 11:27:23
 */
import React, { useMemo } from 'react';
import WrexContext, { useWrexContext } from './WrexContext';
import { isString, isFunction, isPlainObject, isArray } from './utils';
import useWrexStore from './useWrexStore';

// 转换 connect 的参数为统一格式
const transformConnectMappingArg: ReactMegaWrex.TransfromMapping = (
  obj: any,
) => {
  if (isPlainObject(obj)) return Object.keys(obj).map((key) => [key, obj[key]]);

  if (isFunction(obj)) return obj;

  // 仅支持 Array<string> 类型的数据
  if (isArray(obj))
    return obj.reduce((arr: Array<[string, string]>, item: string) => {
      if (isString(item)) arr.push([item, item]);
      return arr;
    }, []);

  if (isString(obj)) return [obj, obj];

  return undefined;
};

// 作为 props 必须是一个 Plain Object
const validateProps = (obj: any) => (isPlainObject(obj) ? obj : {});

type MegaWrexProps = {
  context: ReactMegaWrex.WrexContext;
  children: React.ReactNode;
  store: ReactMegaWrex.WrexStore;
};

const MegaWrex = React.memo((props: MegaWrexProps) => {
  const [defaultStore] = useWrexStore();
  const { store, context = WrexContext, children } = props;
  return (
    <context.Provider value={store || defaultStore}>
      {children}
    </context.Provider>
  );
});

MegaWrex.displayName = 'MegaWrex';

// 连接到 Wrex 上下文
const connect: ReactMegaWrex.Connect = (
  mapStateToProps:
    | ReactMegaWrex.MapStateToProps
    | ReturnType<ReactMegaWrex.TransfromMapping>,
  mapDispatchToProps:
    | ReactMegaWrex.MapDispatchToProps
    | ReturnType<ReactMegaWrex.TransfromMapping>,
  mapLoadingToProps:
    | ReactMegaWrex.MapLoadingToProps
    | ReturnType<ReactMegaWrex.TransfromMapping>,
  options,
) => {
  // 支持 map 参数是字符串、字符串数组、对象、函数
  mapStateToProps = transformConnectMappingArg(mapStateToProps);
  mapDispatchToProps = transformConnectMappingArg(mapDispatchToProps);
  mapLoadingToProps = transformConnectMappingArg(mapLoadingToProps);

  return (Comp: React.FC) => {
    const MemoedComp = React.memo(Comp);

    return React.memo((props) => {
      const { context } = options || {};
      const { state, dispatch, loading } = useWrexContext(context) || {};

      const propsFromState = useMemo(() => {
        if (isFunction(mapStateToProps)) {
          return validateProps(
            (mapStateToProps as ReactMegaWrex.FuncToMapState)(state, props, {
              state,
              dispatch,
            }),
          );
        }

        if (isArray(mapStateToProps)) {
          return mapStateToProps.reduce((acc, [key, path]) => {
            acc[key] = dispatch?.getState(path);
            return acc;
          }, {} as ReactMegaWrex.PO);
        }

        return {};
      }, [state, dispatch, props]);

      const propsFromDispatch = useMemo(() => {
        if (isFunction(mapDispatchToProps)) {
          return validateProps(
            (mapDispatchToProps as ReactMegaWrex.FuncToMapDispatch)(
              dispatch,
              props,
              { state, dispatch },
            ),
          );
        }

        if (isArray(mapDispatchToProps)) {
          return mapDispatchToProps.reduce((acc, [key, name]) => {
            acc[key] = dispatch?.[name];
            return acc;
          }, {} as ReactMegaWrex.PO);
        }

        return {};
      }, [state, dispatch, props]);

      const propsFromLoading = useMemo(() => {
        if (isFunction(mapLoadingToProps)) {
          return validateProps(
            (mapLoadingToProps as ReactMegaWrex.FuncToMapLoading)(
              loading,
              props,
            ),
          );
        }

        // 支持多个 reducer loading 联合判断，只要有一个处于 loading 状态，则视为联合 loading 状态为真。
        if (isArray(mapLoadingToProps)) {
          return mapLoadingToProps.reduce((acc, [key, name]) => {
            acc[key] = isArray(name)
              ? name.reduce((bool, item) => bool || loading?.[item], false)
              : loading?.[name];
            return acc;
          }, {} as ReactMegaWrex.WrexLoading);
        }

        return {};
      }, [loading, props]);

      return (
        <MemoedComp
          {...props}
          {...propsFromState}
          {...propsFromDispatch}
          {...propsFromLoading}
        ></MemoedComp>
      );
    });
  };
};

// 创建一个提供了 Wrex Store 上下文的高阶函数
const createMegaWrex: ReactMegaWrex.CreateMegaWrex =
  (reducers, initialState, init, options) => (Comp: React.FC) =>
    React.memo((props) => {
      const { context = WrexContext } = options || {};
      const [store] = useWrexStore(reducers, initialState, init);
      return (
        <MegaWrex store={store} context={context}>
          <Comp {...props}></Comp>
        </MegaWrex>
      );
    });

type WithMegaWrexOptions = { context?: ReactMegaWrex.WrexContext };

// 返回已绑定上下文的方法
const withMegaWrex = (options?: WithMegaWrexOptions) => {
  const { context = React.createContext({}) } = options || {};

  const _connect: ReactMegaWrex.Connect = (
    mapStateToProps,
    mapDispatchToProps,
    mapLoadingToProps,
    options,
  ) =>
    connect(mapStateToProps, mapDispatchToProps, mapLoadingToProps, {
      ...options,
      context,
    });

  const _createMegaWrex: ReactMegaWrex.CreateMegaWrex = (
    reducers,
    initialState,
    init,
    options,
  ) => createMegaWrex(reducers, initialState, init, { ...options, context });

  const _useWrexContext = () => useWrexContext(context);

  return {
    connect: _connect,
    context,
    createMegaWrex: _createMegaWrex,
    useWrexContext: _useWrexContext,
  };
};

export default MegaWrex;

export { connect, createMegaWrex, withMegaWrex };
