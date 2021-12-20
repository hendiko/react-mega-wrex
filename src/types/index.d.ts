/*
 * @Author: Xavier Yin
 * @Date: 2021-10-23 03:29:31
 */

import React, { Context, Reducer, ReducerState } from 'react';

declare global {
  declare namespace ReactMegaWrex {
    /** Plain Object */
    type PO = { [key: string]: any };

    type WrexState = ReducerState<Reducer<PO, any>>;

    /** The type of payload prop in action passed into Wrex reducer function */
    type WrexActionPayload = PO;

    /** The type of action passed into Wrex reducer function */
    interface WrexAction {
      type: string;
      payload?: WrexActionPayload;
      [key: string]: any;
    }

    /** The path to get value from Wrex store's state */
    type NamePath = string | symbol | Array<string | number | symbol>;

    type ActionHandler = (action: WrexAction) => any;

    /** The boolean that represents the loading status of WrexDispatch's static method's execution. */
    type WrexLoading = { [method: string]: boolean };

    type WrexReactReducer = Reducer<WrexState, WrexAction>;

    // The reducer function for loading
    interface WrexLoadingReducer {
      (
        state: WrexLoading,
        action: { type: string; name: string; count: number },
      ): WrexLoading;
    }

    namespace WrexDispatchMethods {
      type GetState = (namePath: NamePath, defaultValue?: any) => any;
      type GetStates = (...namePaths: NamePath[]) => Array<any>;

      interface SetState {
        (namePath: PO): void;
        (namePath: NamePath, value: any): void;
      }
    }

    interface WrexDispatch {
      (action: string, payload: WrexActionPayload): ReturnType<ActionHandler>;
      (action: function, payload?: any, ...args): any;
      (action: Promise<any>): Promise<any>;
      (action: WrexAction): ReturnType<ActionHandler>;

      getState: WrexDispatchMethods.GetState;

      getStates: WrexDispatchMethods.GetStates;

      setState: WrexDispatchMethods.SetState;

      // eslint-disable-next-line no-use-before-define
      [key: string]: WrexReducer;
    }

    // the props object that is passed into react component.
    type RCProps = { [name: string]: any };

    // the function to help create props from Wrex state, dispatch or loading.
    type FuncToMapState = (
      state: WrexState | undefined,
      props: RCProps | undefined,
      {
        state,
        dispatch,
      }: { state: WrexState | undefined; dispatch: WrexDispatch | undefined },
    ) => RCProps;

    type FuncToMapDispatch = (
      dispatch: WrexDispatch | undefined,
      props: RCProps | undefined,
      {
        state,
        dispatch,
      }: { state: WrexState | undefined; dispatch: WrexDispatch | undefined },
    ) => RCProps;

    type FuncToMapLoading = (
      loading: WrexLoading | undefined,
      props: RCProps | undefined,
    ) => RCProps;

    interface TransfromMapping {
      (
        mapping:
          | string
          | string[]
          | { [propName: string]: string }
          | { [propName: string]: NamePath },
      ): Array<[string, string]>;

      <T extends FuncToMapState | FuncToMapDispatch | FuncToMapLoading>(
        fn: T,
      ): T;

      (other: any): void;
    }

    type OperationCall = (...args) => ReturnType<WrexDispatch>;
    type OperationClear = () => ReturnType<WrexDispatch>;
    type OperationMerge = (payload: WrexActionPayload) => void;
    type OperationGet = (namePath: NamePath, defaultValue?: any) => any;
    type OperationReset = (payload?: WrexActionPayload) => void;
    interface OperationSet {
      (namePath: WrexActionPayload): void;
      (namePath: NamePath, value: any): void;
    }

    interface WrexActionOperations {
      // 在 reducer
      call: OperationCall;
      clear: OperationClear;
      get: OperationGet;
      merge: OperationMerge;
      reset: OperationReset;
      set: OperationSet;
    }

    interface WrexReducer extends Reducer {
      (
        state?: WrexState,
        action?: WrexAction,
        operations?: WrexActionOperations & { loading: WrexLoading },
      ): WrexState | void;
    }

    // Reducers for useWrexStore hook
    interface WrexReducers {
      [name: string]: WrexReducer;
    }

    type WrexReducerNames = Array<Extract<keyof WrexReducers, string>>;

    type WrexReducerInitializer = (
      arg: WrexState,
    ) => ReducerState<WrexReactReducer>;

    /** The Wrex store  */
    interface WrexStore {
      dispatch: WrexDispatch;
      loading: WrexLoading;
      operations: WrexActionOperations;
      state: WrexState;
    }

    type WrexContext = Context<Partial<WrexStore>>;

    interface CreateMegaWrex {
      (
        reducers?: WrexReducers,
        initialState?: WrexState,
        init?: WrexReducerInitializer,
        options?: { context?: WrexContext },
      ): (Comp: React.FC) => React.ReactNode;
    }

    type MapStateToProps = string | string[] | PO | FuncToMapState;
    type MapDispatchToProps = string | string[] | PO | FuncToMapDispatch;
    type MapLoadingToProps = string | string[] | WrexLoading | FuncToMapLoading;

    interface Connect {
      (
        mapStateToProps?: MapStateToProps,
        mapDispatchToProps?: MapDispatchToProps,
        mapLoadingToProps?: MapLoadingToProps,
        options?: { context?: WrexContext },
      ): (Comp: React.FC) => React.ReactNode;
    }
  }
}

export default ReactMegaWrex;
