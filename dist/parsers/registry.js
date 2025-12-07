"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserMap = exports.getParser = exports.registerParser = void 0;
const registry = {};
const registerParser = (name, parser) => {
    registry[name] = parser;
};
exports.registerParser = registerParser;
const getParser = (name) => {
    return registry[name];
};
exports.getParser = getParser;
exports.parserMap = new Proxy({}, {
    get: (_target, prop) => {
        if (typeof prop === "string") {
            return registry[prop];
        }
        return undefined;
    },
    ownKeys: () => Reflect.ownKeys(registry),
    getOwnPropertyDescriptor: (_target, prop) => {
        if (typeof prop === "string" && prop in registry) {
            return {
                configurable: true,
                enumerable: true,
                value: registry[prop],
                writable: true,
            };
        }
        return undefined;
    },
});
