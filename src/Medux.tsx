/*
 * @Author: Xavier Yin
 * @Date: 2021-11-24 11:27:23
 */
import React, { useMemo } from 'react';
import MeduxContext, { useMeduxContext } from './MeduxContext';
import { isString, isFunction, isPlainObject, isArray } from './utils';
import useMeduxStore from './useMeduxStore';

// 转换 connect 的参数为统一格式
const transformConnectMappingArg: ReactMedux.TransfromMapping = (obj: any) => {
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

type MeduxProps = {
  context: ReactMedux.MeduxContext;
  children: React.ReactNode;
  store: ReactMedux.MeduxStore;
};

const Medux = React.memo((props: MeduxProps) => {
  const { store, context = MeduxContext, children } = props;
  return <context.Provider value={store}>{children}</context.Provider>;
});

Medux.displayName = 'Medux';

// 连接到 Medux 上下文
const connect: ReactMedux.Connect = (
  mapStateToProps:
    | ReactMedux.MapStateToProps
    | ReturnType<ReactMedux.TransfromMapping>,
  mapDispatchToProps:
    | ReactMedux.MapDispatchToProps
    | ReturnType<ReactMedux.TransfromMapping>,
  mapLoadingToProps:
    | ReactMedux.MapLoadingToProps
    | ReturnType<ReactMedux.TransfromMapping>,
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
      const { state, dispatch, loading } = useMeduxContext(context) || {};

      const propsFromState = useMemo(() => {
        if (isFunction(mapStateToProps)) {
          return validateProps(
            (mapStateToProps as ReactMedux.FuncToMapState)(state, props, {
              state,
              dispatch,
            }),
          );
        }

        if (isArray(mapStateToProps)) {
          return mapStateToProps.reduce((acc, [key, path]) => {
            acc[key] = dispatch?.getState(path);
            return acc;
          }, {} as ReactMedux.PO);
        }

        return {};
      }, [state, dispatch, props]);

      const propsFromDispatch = useMemo(() => {
        if (isFunction(mapDispatchToProps)) {
          return validateProps(
            (mapDispatchToProps as ReactMedux.FuncToMapDispatch)(
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
          }, {} as ReactMedux.PO);
        }

        return {};
      }, [state, dispatch, props]);

      const propsFromLoading = useMemo(() => {
        if (isFunction(mapLoadingToProps)) {
          return validateProps(
            (mapLoadingToProps as ReactMedux.FuncToMapLoading)(loading, props),
          );
        }

        // 支持多个 reducer loading 联合判断，只要有一个处于 loading 状态，则视为联合 loading 状态为真。
        if (isArray(mapLoadingToProps)) {
          return mapLoadingToProps.reduce((acc, [key, name]) => {
            acc[key] = isArray(name)
              ? name.reduce((bool, item) => bool || loading?.[item], false)
              : loading?.[name];
            return acc;
          }, {} as ReactMedux.MeduxLoading);
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

// 创建一个提供了 Medux Store 上下文的高阶函数
const createMedux: ReactMedux.CreateMedux =
  (reducers, initialState, init, options) => (Comp: React.FC) =>
    React.memo((props) => {
      const { context = MeduxContext } = options || {};
      const [store] = useMeduxStore(reducers, initialState, init);
      return (
        <Medux store={store} context={context}>
          <Comp {...props}></Comp>
        </Medux>
      );
    });

type WithMeduxOptions = { context?: ReactMedux.MeduxContext };

// 返回已绑定上下文的方法
const withMedux = (options?: WithMeduxOptions) => {
  const { context = React.createContext({}) } = options || {};

  const _connect: ReactMedux.Connect = (
    mapStateToProps,
    mapDispatchToProps,
    mapLoadingToProps,
    options,
  ) =>
    connect(mapStateToProps, mapDispatchToProps, mapLoadingToProps, {
      ...options,
      context,
    });

  const _createMedux: ReactMedux.CreateMedux = (
    reducers,
    initialState,
    init,
    options,
  ) => createMedux(reducers, initialState, init, { ...options, context });

  const _useMeduxContext = () => useMeduxContext(context);

  return {
    connect: _connect,
    context,
    createMedux: _createMedux,
    useMeduxContext: _useMeduxContext,
  };
};

export default Medux;

export { connect, createMedux, withMedux };
