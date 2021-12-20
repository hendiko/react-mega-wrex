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
exports.withMegaWrex = exports.useWrexStore = exports.useWrexContext = exports.createMegaWrex = exports.connect = exports.WrexContext = exports.MegaWrex = void 0;
/*
 * @Author: Xavier Yin
 * @Date: 2021-11-24 09:19:15
 */
const Wrex_1 = __importStar(require("./Wrex"));
exports.MegaWrex = Wrex_1.default;
Object.defineProperty(exports, "connect", { enumerable: true, get: function () { return Wrex_1.connect; } });
Object.defineProperty(exports, "createMegaWrex", { enumerable: true, get: function () { return Wrex_1.createMegaWrex; } });
Object.defineProperty(exports, "withMegaWrex", { enumerable: true, get: function () { return Wrex_1.withMegaWrex; } });
const WrexContext_1 = __importStar(require("./WrexContext"));
exports.WrexContext = WrexContext_1.default;
Object.defineProperty(exports, "useWrexContext", { enumerable: true, get: function () { return WrexContext_1.useWrexContext; } });
const useWrexStore_1 = __importDefault(require("./useWrexStore"));
exports.useWrexStore = useWrexStore_1.default;
