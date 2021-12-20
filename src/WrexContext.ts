/*
 * @Author: Xavier Yin
 * @Date: 2021-10-23 03:27:26
 */
import React, { useContext } from 'react';

// As default context for wrex
const WrexContext: ReactMegaWrex.WrexContext = React.createContext({});

// A shortcut for calling useContext
const useWrexContext = (Context?: ReactMegaWrex.WrexContext) =>
  useContext(Context || WrexContext);

export { useWrexContext };

export default WrexContext;
