import { type ParserFunction, type ParserName } from "./types";

const registry: Record<string, ParserFunction> = {};

export const registerParser = (
  name: ParserName,
  parser: ParserFunction
): void => {
  registry[name] = parser;
};

export const getParser = (name: ParserName): ParserFunction | undefined => {
  return registry[name];
};

export const parserMap: Record<string, ParserFunction> = new Proxy(
  {},
  {
    get: (_target, prop: string | symbol) => {
      if (typeof prop === "string") {
        return registry[prop];
      }
      return undefined;
    },
    ownKeys: () => {
      return Reflect.ownKeys(registry);
    },
    getOwnPropertyDescriptor: (_target, prop: string | symbol) => {
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
  }
);
