import { Window } from "happy-dom";

// Some transitive dependencies (e.g. swagger-parser used by registry tests)
// reference the global `location` object. Provide a minimal stub so the
// happy-dom Window polyfill does not leak broken browser globals into
// non-browser tests when this file is preloaded for the whole suite.
if (typeof globalThis.location === "undefined") {
  // @ts-ignore
  globalThis.location = { href: "http://localhost/" };
}

const window = new Window();
const document = window.document;

// @ts-ignore
globalThis.window = window;
// @ts-ignore
globalThis.document = document;
// @ts-ignore
globalThis.navigator = window.navigator;
// @ts-ignore
globalThis.HTMLElement = window.HTMLElement;
// @ts-ignore
globalThis.Element = window.Element;
// @ts-ignore
globalThis.Node = window.Node;
// @ts-ignore
globalThis.Text = window.Text;
// @ts-ignore
globalThis.DocumentFragment = window.DocumentFragment;
// @ts-ignore
globalThis.Event = window.Event;
// @ts-ignore
globalThis.MouseEvent = window.MouseEvent;
// @ts-ignore
globalThis.KeyboardEvent = window.KeyboardEvent;
// @ts-ignore
globalThis.MutationObserver = window.MutationObserver;
// @ts-ignore
globalThis.DOMParser = window.DOMParser;
// @ts-ignore
globalThis.XMLSerializer = window.XMLSerializer;
// @ts-ignore
globalThis.URL = window.URL;
// @ts-ignore
globalThis.localStorage = window.localStorage;
// @ts-ignore
globalThis.sessionStorage = window.sessionStorage;
// @ts-ignore
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
// @ts-ignore
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
