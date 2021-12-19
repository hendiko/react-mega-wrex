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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMeduxContext = void 0;
/*
 * @Author: Xavier Yin
 * @Date: 2021-10-23 03:27:26
 */
var react_1 = __importStar(require("react"));
// As default context for medux
var MeduxContext = react_1.default.createContext({});
// A shortcut for calling useContext
var useMeduxContext = function (Context) { return (0, react_1.useContext)(Context || MeduxContext); };
exports.useMeduxContext = useMeduxContext;
exports.default = MeduxContext;
