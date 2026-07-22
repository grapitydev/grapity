import { Window } from "happy-dom";
import { afterEach } from "bun:test";

// Capture the runtime's native fetch before happy-dom replaces the global.
// Network-level integration tests can restore this to avoid happy-dom's fetch
// hanging on streaming HTTP responses from the registry server.
// @ts-ignore
const nodeFetch = globalThis.fetch;
// @ts-ignore
globalThis.__NODE_FETCH__ = nodeFetch;

// Restore the native fetch after every test in every file. All test files
// share a single process, and hub component tests stub `global.fetch` with
// mocks. Without a global restore, a leaked stub poisons later files that
// perform real network I/O (registry integration servers, keycloak token
// fetches, jose JWKS validation inside app.request).
afterEach(() => {
  globalThis.fetch = nodeFetch;
});

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
