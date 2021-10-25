/*
 * @Author: Xavier Yin
 * @Date: 2021-09-13 23:12:12
 */
import loget from "lodash/get";
import isPlainObject from "lodash/isPlainObject";
import isArray from "lodash/isArray";
import loset from "lodash/set";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

const ReducersContext = React.createContext();

const isFunction = (fn) => typeof fn === "function";
const isString = (str) => typeof str === "string";

const reducer = (state, action) => {
  const { type, payload } = action;
  if (type === "merge")
    return state === payload ? state : { ...state, ...payload };
  if (type === "reset") return payload;
  if (type === "clear") return {};
  return state;
};

const loadingReducer = (state, action) => {
  const { type, name, count } = action;

  if (type === "change") {
    if (state[name] === !!count) return state;
    return { ...state, [name]: !!count };
  }

  return state;
};

const initCounter = (names) =>
  names.reduce((acc, name) => {
    acc[name] = 0;
    return acc;
  }, {});

const initLoadings = (names) =>
  names.reduce((acc, name) => {
    acc[name] = false;
    return acc;
  }, {});

const useReducers = (reducers, initialState, init, options) => {
  const { context = ReducersContext } = options || {};
  const [[$reducers, $initialState, $init]] = useState([
    reducers,
    { ...initialState },
    init,
  ]);

  const names = useMemo(() => Object.keys($reducers), [$reducers]);

  const [state, dispatch] = useReducer(reducer, $initialState, $init);
  const [loadings, dispatchLoading] = useReducer(
    loadingReducer,
    names,
    initLoadings
  );

  const counter = useMemo(() => initCounter(names), [names]);
  const counterRef = useRef(counter);

  const loadingRef = useRef(loadings);
  loadingRef.current = loadings;

  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatchFnRef = useRef();

  const initState = useMemo(
    () =>
      isFunction($init) ? { ...$init($initialState) } : { ...$initialState },
    [$initialState, $init]
  );

  const operations = useMemo(() => {
    const $merge = (payload) => {
      if (isPlainObject(payload)) dispatch({ type: "merge", payload });
    };

    const $reset = (payload) => {
      dispatch({
        type: "reset",
        payload: isPlainObject(payload) ? payload : { ...initState },
      });
    };

    const $clear = () => dispatch({ type: "clear" });

    const $set = (namePath, value) =>
      dispatch({
        type: "merge",
        payload: loset({ ...stateRef.current }, namePath, value),
      });

    const $get = (namePath, defaultValue) =>
      loget(stateRef.current, namePath, defaultValue);

    const $call = (...args) => dispatchFnRef.current(...args);

    return {
      merge: $merge,
      reset: $reset,
      clear: $clear,
      set: $set,
      get: $get,
      call: $call,
    };
  }, [initState]);

  // change the count of reducer calling
  const alterLoading = useCallback((act, reducerName) => {
    if (act === "+") counterRef.current[reducerName] += 1;
    if (act === "-") counterRef.current[reducerName] -= 1;
    dispatchLoading({
      type: "change",
      name: reducerName,
      count: counterRef.current[reducerName],
    });
  }, []);

  const dispatchAction = useCallback(
    (action) => {
      const { type } = action;
      const fn = $reducers?.[type];
      if (!isFunction(fn)) return;

      const result = fn(stateRef.current, action, {
        ...operations,
        loading: loadingRef.current,
      });

      // 以 get 开头的驼峰命名为 get 函数，例如 getName 是 get 函数，但 getname 不是。
      // eslint-disable-next-line consistent-return
      if (/^get[A-Z]/.test(type)) return result;

      if (isFunction(result?.then)) {
        alterLoading("+", type);
        Promise.resolve(result)
          .then((resolved) => {
            alterLoading("-", type);
            operations.merge(resolved);
          })
          .catch((e) => {
            alterLoading("-", type);
            return Promise.reject(e);
          });
      } else {
        operations.merge(result);
      }
    },
    [$reducers, operations, alterLoading]
  );

  const dispatchFn = useMemo(() => {
    // eslint-disable-next-line consistent-return
    const fn = (action, ...args) => {
      // 传入 action 为对象时，直接触发 dispatch
      if (isPlainObject(action)) {
        return dispatchAction(action);
      }
      // 如果 action 为字符串，第一个参数作为 type，第二个参数作为 payload 传入 dispatch
      if (typeof action === "string") {
        return dispatchAction({ type: action, payload: args[0] });
      }
      if (isFunction(action)) {
        const result = action(stateRef.current, dispatchFn, ...args);
        if (isFunction(result?.then)) {
          return Promise.resolve(result).then((resolved) =>
            dispatchFn(resolved)
          );
        }
        return dispatchFn(result);
      }
    };

    // 添加 reducers 的 type 作为 dispatch 方法名，以便快速调用。
    // 例如：reducers = {getName(state, action) {}}
    // 你可以 dispatch({type: 'getName', name}) 或者 dispatch.getName({name});
    Object.keys($reducers).forEach((type) => {
      fn[type] = (action) => fn({ ...action, type });
    });

    // 获取 state 值的方法
    fn.getState = (namePath) =>
      namePath === undefined
        ? stateRef.current
        : loget(stateRef.current, namePath);

    // 批量获取 state 值，返回数组
    fn.getStates = (...namePaths) =>
      namePaths.map((path) => loget(stateRef.current, path));

    // 设置 state，小心使用(所有的 state 变化应该通过 reducer 来更新)
    fn.setState = (namePath, value) => {
      if (isPlainObject(namePath)) {
        operations.merge(namePath);
      } else {
        operations.set(namePath, value);
      }
    };

    return fn;
  }, [dispatchAction, $reducers, operations]);

  dispatchFnRef.current = dispatchFn;

  const notifyRef = useRef();

  const Provider = useMemo(
    () =>
      React.memo((props) => {
        const [, notify] = useState();
        notifyRef.current = notify;
        const { children } = props;
        const precedentCtxValue = useContext(context);

        // eslint-disable-next-line no-shadow
        const [state, dispatch, loading] = [
          stateRef.current,
          dispatchFnRef.current,
          loadingRef.current,
        ];

        const ctxValue = useMemo(
          () => ({
            ...precedentCtxValue,
            reducersStore: {
              state,
              dispatch,
              loading,
            },
          }),
          [precedentCtxValue, state, dispatch, loading]
        );
        return <context.Provider value={ctxValue}>{children}</context.Provider>;
      }),
    [context]
  );

  useEffect(() => {
    notifyRef.current?.({});
  }, [state, dispatchFn, loadings]);

  return [state, dispatchFn, { operations, loading: loadings, Provider }];
};

const mapStateToProps = (dispatch, mapState) => {
  if (isPlainObject(mapState) && isFunction(dispatch)) {
    return Object.fromEntries(
      Object.entries(mapState).map(([propName, namePath]) => [
        propName,
        dispatch.getState(namePath),
      ])
    );
  }
  return null;
};

const mapDispatchToProps = (dispatch, mapState) => {
  if (
    isPlainObject(mapState) &&
    (isFunction(dispatch) || isPlainObject(dispatch))
  ) {
    return Object.fromEntries(
      Object.entries(mapState).map(([propName, reducerName]) => [
        propName,
        dispatch[reducerName],
      ])
    );
  }
  return null;
};

const mapLoadingToProps = (loading, mapLoading) =>
  mapDispatchToProps(loading, mapLoading);

const arrToObject = (arr) =>
  Object.fromEntries(
    arr.map((item) => [isArray(item) ? item.join(".") : item, item])
  );

const connect =
  (mapState, mapDispatch, mapLoading, options) => (Comp) => (props) => {
    const {
      context = ReducersContext,
      pure = true,
      injectReducersStore = false,
    } = options || {};
    const { reducersStore } = useContext(context);
    const { state, dispatch, loading } = reducersStore || {};

    const stateToProps = useMemo(
      () =>
        isString(mapState)
          ? mapStateToProps(dispatch, { [mapState]: mapState })
          : isArray(mapState)
          ? mapStateToProps(dispatch, arrToObject(mapState))
          : isFunction(mapState)
          ? mapState(state, props, dispatch)
          : mapStateToProps(dispatch, mapState),
      [state, dispatch, props]
    );

    const dispatchToProps = useMemo(
      () =>
        isString(mapDispatch)
          ? mapDispatchToProps(dispatch, { [mapDispatch]: mapDispatch })
          : isArray(mapDispatch)
          ? mapDispatchToProps(dispatch, arrToObject(mapDispatch))
          : isFunction(mapDispatch)
          ? mapDispatch(dispatch, props)
          : mapDispatchToProps(dispatch, mapDispatch),
      [dispatch, props]
    );

    const loadingToProps = useMemo(
      () =>
        isString(mapLoading)
          ? mapLoadingToProps(loading, { [mapLoading]: mapLoading })
          : isArray(mapLoading)
          ? mapLoadingToProps(loading, arrToObject(mapLoading))
          : isFunction(mapLoading)
          ? mapLoading(loading, props)
          : mapLoadingToProps(loading, mapLoading),
      [loading, props]
    );

    const injectedReducersStore = useMemo(
      () => (injectReducersStore ? { reducersStore } : {}),
      [injectReducersStore, reducersStore]
    );

    const PureComp = useMemo(() => (pure ? React.memo(Comp) : Comp), [pure]);

    return (
      <PureComp
        {...props}
        {...stateToProps}
        {...dispatchToProps}
        {...loadingToProps}
        {...injectedReducersStore}
      />
    );
  };

const ReducersProvider = (props) => {
  const {
    state,
    dispatch,
    loading,
    context = ReducersContext,
    ...props$
  } = props;
  const precedentCtxValue = useContext(context);
  const ctxValue = useMemo(
    () => ({
      ...precedentCtxValue,
      reducersStore: { state, dispatch, loading },
    }),
    [state, dispatch, loading, precedentCtxValue]
  );
  return <context.Provider {...props$} value={ctxValue} />;
};

const Reducers = (props) => {
  const {
    reducers,
    initialState,
    init,
    context = ReducersContext,
    ...props$
  } = props;

  const [state, dispatch, { loading }] = useReducers(
    reducers,
    initialState,
    init
  );

  return (
    <ReducersProvider
      {...props$}
      state={state}
      dispatch={dispatch}
      loading={loading}
      context={context}
    />
  );
};

const provide = (reducers, initialState, init, options) => (Comp) => {
  const PureComp = React.memo(Comp);

  return (props) => {
    const [state, dispatch, { loading, Provider }] = useReducers(
      reducers,
      initialState,
      init,
      options
    );

    const store = useMemo(
      () => ({ state, dispatch, loading }),
      [state, dispatch, loading]
    );

    return (
      <Provider>
        <PureComp {...props} reducersStore={store}></PureComp>
      </Provider>
    );
  };
};

export default useReducers;

export {
  connect,
  provide,
  Reducers,
  ReducersContext,
  ReducersProvider,
  useReducers,
};
