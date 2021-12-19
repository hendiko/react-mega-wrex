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
exports.withMedux = exports.useMeduxStore = exports.useMeduxContext = exports.createMedux = exports.connect = exports.MeduxContext = exports.Medux = void 0;
/*
 * @Author: Xavier Yin
 * @Date: 2021-11-24 09:19:15
 */
const Medux_1 = __importStar(require("./Medux"));
exports.Medux = Medux_1.default;
Object.defineProperty(exports, "connect", { enumerable: true, get: function () { return Medux_1.connect; } });
Object.defineProperty(exports, "createMedux", { enumerable: true, get: function () { return Medux_1.createMedux; } });
Object.defineProperty(exports, "withMedux", { enumerable: true, get: function () { return Medux_1.withMedux; } });
const MeduxContext_1 = __importStar(require("./MeduxContext"));
exports.MeduxContext = MeduxContext_1.default;
Object.defineProperty(exports, "useMeduxContext", { enumerable: true, get: function () { return MeduxContext_1.useMeduxContext; } });
const useMeduxStore_1 = __importDefault(require("./useMeduxStore"));
exports.useMeduxStore = useMeduxStore_1.default;
