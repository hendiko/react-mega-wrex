/*
 * @Author: Xavier Yin
 * @Date: 2021-11-23 22:21:15
 * @Last Modified by: Xavier Yin
 * @Last Modified time: 2021-12-19 23:13:25
 */
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { loadingReducer, storeReducer } from './reducer';
import { isFunction, isPlainObject, isThenable, loget, loset } from './utils';

// ---------------------------------------------------------------------

/** LoadingReducer 的初始化函数 */
const initLoadingReducerState = (names: ReactMedux.MeduxReducerNames) =>
  names.reduce((state, name) => {
    // 默认初始化所有加载状态都是为否
    state[name] = false;
    return state;
  }, {} as ReactMedux.MeduxLoading);

/**
 * The hook being similar to useReducer which is provided by React can be
 * multiple and independent stores that manage states for react components.
 */
function useMeduxStore(
  reducers?: ReactMedux.MeduxReducers,
  initialState?: ReactMedux.MeduxState,
  init?: ReactMedux.MeduxReducerInitializer,
) {
  const [[storeReducers, storeInitialState, storeInit]] = useState<
    [
      ReactMedux.MeduxReducers,
      ReactMedux.MeduxState,
      ReactMedux.MeduxReducerInitializer,
    ]
  >([
    { ...reducers },
    (isPlainObject(initialState) ? initialState : {}) as ReactMedux.MeduxState,
    init as ReactMedux.MeduxReducerInitializer,
  ]);

  // 备份初始化状态值
  const [initialStateBackup] = useState<ReactMedux.MeduxState>({
    ...initialState,
  });

  // the array of names that come from the given reducer functions.
  const reducerNames: ReactMedux.MeduxReducerNames = useMemo(
    () => Object.keys(storeReducers),
    [storeReducers],
  );

  const [storeState, storeDispatch] = useReducer<
    ReactMedux.MeduxReactReducer,
    ReactMedux.MeduxState
  >(storeReducer, storeInitialState, storeInit);

  // 维护所有 core reducer 执行状态
  const [loadingState, loadingDispatch] = useReducer(
    loadingReducer,
    reducerNames,
    initLoadingReducerState,
  );

  const reducerExecutionCounter: { [key: string]: number } = useMemo(
    () =>
      reducerNames.reduce((state, name) => {
        state[name] = 0;
        return state;
      }, {} as ReactMedux.PO),
    [reducerNames],
  );

  const counterRef = useRef(reducerExecutionCounter);
  const dispatchRef = useRef<ReactMedux.MeduxDispatch>();
  const loadingStateRef = useRef(loadingState);
  const storeStateRef = useRef<ReactMedux.MeduxState>(storeState);

  counterRef.current = reducerExecutionCounter;
  loadingStateRef.current = loadingState;
  storeStateRef.current = storeState;

  // Store State 快捷操作函数
  const operations: ReactMedux.MeduxActionOperations = useMemo(() => {
    // 调用 dispatch
    const call: ReactMedux.OperationCall = (action, payload, ...args) =>
      dispatchRef.current?.(action, payload, ...args);

    // 清空 state 值
    const clear: ReactMedux.OperationClear = () =>
      storeDispatch({ type: 'clear' });

    // 获取指定路径的 state 属性值
    const get: ReactMedux.OperationGet = (namePath, defaultValue?) =>
      loget(storeStateRef.current, namePath, defaultValue);

    // 只允许使用 Plain Object 进行合并更新 state 操作
    const merge: ReactMedux.OperationMerge = (payload) => {
      if (isPlainObject(payload)) storeDispatch({ type: 'merge', payload });
    };

    // 重置 store state
    // 如果提供了 Plain Object 作为 payload 参数，则将 state 重置为 payload
    // 否则重置至 store 的初始 state 值
    const reset: ReactMedux.OperationReset = (payload) => {
      if (isPlainObject(payload)) {
        storeDispatch({ type: 'reset', payload });
      } else {
        payload = isFunction(storeInit)
          ? storeInit(initialStateBackup)
          : initialStateBackup;

        storeDispatch({
          type: 'reset',
          payload: isPlainObject(payload) ? { ...payload } : {},
        });
      }
    };

    // 支持直接 set 一个 Plain Object（等同于 merge 操作）或者按路 namePath 设置 value
    const set = (
      namePath: ReactMedux.MeduxActionPayload | ReactMedux.NamePath,
      value: any,
    ) => {
      // if namePath is a PayloadObject
      if (isPlainObject(namePath)) {
        merge(namePath as ReactMedux.MeduxActionPayload);
      } else {
        // when the namePath is a NamePath
        storeDispatch({
          type: 'merge',
          payload: loset(
            { ...storeStateRef.current },
            namePath as ReactMedux.NamePath,
            value,
          ),
        });
      }
    };

    return {
      call,
      clear,
      get,
      merge,
      reset,
      set,
    } as ReactMedux.MeduxActionOperations;
  }, [storeDispatch, storeInit, initialStateBackup]);

  // 更新 store 的 reduce 函数执行状态
  const updateLoadingState = useCallback(
    (act, storeReduceName) => {
      if (act === '+') counterRef.current[storeReduceName] += 1;
      if (act === '-') counterRef.current[storeReduceName] -= 1;
      loadingDispatch({
        type: 'change',
        name: storeReduceName,
        count: counterRef.current[storeReduceName],
      });
    },
    [loadingDispatch],
  );

  // 处理 MeduxAction，调用指定的 reducer 函数（如果存在的话），更新 store state
  const handleAction = useCallback(
    (action: ReactMedux.MeduxAction): any => {
      const { type } = action;
      const reducer = storeReducers?.[type];
      // 如果不存在 action 中指定的 reducer 函数，则直接退出
      if (!isFunction(reducer)) return;

      const result = reducer(storeStateRef.current, action, {
        ...operations,
        loading: loadingStateRef.current,
      });

      const isPromiseResult = isThenable(result);

      // 异步函数的执行，更新 loading 状态值
      if (isPromiseResult) {
        updateLoadingState('+', type);
        Promise.resolve(result).then(
          () => updateLoadingState('-', type),
          () => updateLoadingState('-', type),
        );
      }

      // 如果此次 action 是一个 get 函数，则直接返回结果。
      // 如果此次 action 是非 get 函数，则需要将结果更新到 store

      // reducer 是 get 函数，返回 reducer 执行结果，结果不自动更新到 StoreState 中
      // 以 get 开头的驼峰命名为 get 函数，例如 getName 是 get 函数，但 getname 不是。
      if (/^get[A-Z]/.test(type)) {
        // 如果 reducer 名称以 Async 结尾，表示这是一个异步函数，统一返回 Promise
        // 否则直接返回 reducer 的执行结果。
        // eslint-disable-next-line consistent-return
        return /Async$/.test(type) ? Promise.resolve(result) : result;
      }

      // 非 get 函数，reducer 的返回结果直接合并到 StoreState 中
      if (isPromiseResult) {
        Promise.resolve(result).then(
          (value: any) => operations.merge(value),
          () => undefined,
        );
      } else {
        operations.merge(result as ReactMedux.MeduxActionPayload);
      }
    },
    [storeReducers, updateLoadingState, operations],
  );

  const dispatch: ReactMedux.MeduxDispatch = useMemo(() => {
    // 只有 action 为 Plain Object 或者 String 的时候，才会触发 handleAction 函数进行 MeduxState 的状态更新检查
    // 当 action 为 Promise 或函数时，递归调用 MeduxDispatch 来接收 Promise 的 settled 值或函数返回值。
    const fn: ReactMedux.MeduxDispatch = ((action, payload, ...args) => {
      // 传入 action 为对象时，直接触发 dispatch
      if (isPlainObject(action))
        return handleAction(action as ReactMedux.MeduxAction);

      // 如果 action 为字符串，第一个参数作为 type，第二个参数作为 payload 传入 dispatch
      if (typeof action === 'string')
        return handleAction({
          type: action,
          payload,
        } as ReactMedux.MeduxAction);

      if (isThenable(action)) {
        return Promise.resolve(action).then(
          (value: any) => fn(value),
          () => undefined,
        );
      }

      // 如果 action 是一个函数，则该函数将接受 (storeState, dispatch, payload, ...args) 参数
      if (isFunction(action)) {
        const result = action(storeStateRef.current, fn, payload, ...args);
        return fn(result);
      }
      return undefined;
    }) as ReactMedux.MeduxDispatch;

    // 添加 reducers 的 type 作为 dispatch 方法名，以便快速调用。
    // 例如：reducers = {getName(state, action) {}}
    // 你可以 dispatch({type: 'getName', name}) 或者 dispatch.getName({name});
    reducerNames.forEach((name: string) => {
      // 只能接受对象格式的 action，action 中可以不用指定 type，即使指定了 type 也是无效的。
      fn[name] = (action) => fn({ ...action, type: name });
    });

    // 不要将 reducer 名称命名为 getState, getStates, setState，否则会被以下默认方法覆盖。
    // 虽然你仍然可以通过 dispatch({type: 'getState'}) 这种方式来调用你的 reducer，但请尽量避免这种理解混乱。

    // 获取 store state 值的方法
    // 获取完整的 MeduxState 值，或者按路径取 MeduxState 的子属性值。
    // 如果指定的路径不存在，则返回 defaultValue 作为默认值。
    fn.getState = (namePath, defaultValue) => {
      const { current: storeState } = storeStateRef;
      // 如果不传任何路径，则返回当前完整的 storeState。
      return namePath === undefined
        ? storeState
        : loget(storeState, namePath, defaultValue);
    };

    // 批量获取 store state 值，返回数组
    fn.getStates = (...namePaths) =>
      namePaths.map((namePath) => operations.get(namePath));

    // 直接更新 store
    // [警告]设置 state，小心使用(所有的 state 变化应该通过 reducer 来更新)
    // 如果 namePath 为 PlainObject 则被直接合并到当前的 storeState 中
    // 如果 namePath 表示路径，则设定指定路径值为 value
    fn.setState = (namePath, value?: any) => {
      operations.set(namePath as ReactMedux.NamePath, value);
    };

    return fn;
  }, [reducerNames, handleAction, operations]);

  dispatchRef.current = dispatch;

  const store: ReactMedux.MeduxStore = useMemo(
    () => ({
      dispatch,
      loading: loadingState,
      operations,
      state: storeState,
    }),
    [dispatch, loadingState, operations, storeState],
  );

  return [store];
}

export default useMeduxStore;
