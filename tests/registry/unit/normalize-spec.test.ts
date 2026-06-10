import { describe, it, expect } from "bun:test";
import yaml from "js-yaml";
import { normalizeSpec } from "registry/utils/normalize-spec";

describe("normalizeSpec", () => {
  it("sorts root-level keys in semantic OpenAPI order", () => {
    const input = JSON.stringify({
      externalDocs: { url: "https://docs.example.com" },
      security: [{ apiKey: [] }],
      components: { schemas: {} },
      paths: { "/users": {} },
      tags: [{ name: "users" }],
      servers: [{ url: "https://api.example.com" }],
      info: { title: "API", version: "1.0" },
      openapi: "3.1.0",
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual([
      "openapi",
      "info",
      "servers",
      "tags",
      "paths",
      "components",
      "security",
      "externalDocs",
    ]);
  });

  it("sorts nested object keys alphabetically by default", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      info: { title: "API", version: "1.0", description: "desc" },
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed.info)).toEqual(["description", "title", "version"]);
  });

  it("preserves array order", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      servers: [
        { url: "https://a.com" },
        { url: "https://b.com" },
      ],
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    expect(parsed.servers).toHaveLength(2);
    expect(parsed.servers[0].url).toBe("https://a.com");
    expect(parsed.servers[1].url).toBe("https://b.com");
  });

  it("preserves JSON format for JSON input", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      info: { title: "API", version: "1.0" },
    });
    const result = normalizeSpec(input);
    expect(result.trim()).toStartWith("{");
    expect(result.trim()).toEndWith("}");
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)[0]).toBe("openapi");
  });

  it("preserves YAML format for YAML input", () => {
    const input = "openapi: 3.1.0\ninfo:\n  title: API\n  version: '1.0'";
    const result = normalizeSpec(input);
    expect(result.trim()).toStartWith("openapi:");
    const parsed = yaml.load(result) as Record<string, unknown>;
    expect(Object.keys(parsed)[0]).toBe("openapi");
  });

  it("handles empty objects", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      info: {},
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    expect(parsed.info).toEqual({});
  });

  it("handles null values", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      info: { title: null, version: "1.0" },
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    expect(parsed.info).toEqual({ title: null, version: "1.0" });
  });

  it("sorts components in semantic order", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      components: {
        callbacks: {},
        links: {},
        securitySchemes: {},
        headers: {},
        requestBodies: {},
        parameters: {},
        responses: {},
        schemas: {},
      },
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed.components)).toEqual([
      "schemas",
      "responses",
      "parameters",
      "requestBodies",
      "headers",
      "securitySchemes",
      "links",
      "callbacks",
    ]);
  });

  it("sorts operations in semantic order", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      paths: {
        "/users": {
          get: {
            deprecated: true,
            security: [],
            responses: { "200": { description: "ok" } },
            requestBody: { content: {} },
            parameters: [],
            operationId: "getUsers",
            description: "Get users",
            summary: "Get users",
            tags: ["users"],
          },
        },
      },
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    const op = parsed.paths["/users"].get;
    expect(Object.keys(op)).toEqual([
      "tags",
      "summary",
      "description",
      "operationId",
      "parameters",
      "requestBody",
      "responses",
      "security",
      "deprecated",
    ]);
  });

  it("sorts path items with HTTP methods first", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      paths: {
        "/users": {
          summary: "Users",
          parameters: [],
          delete: { operationId: "deleteUser" },
          get: { operationId: "getUsers" },
          post: { operationId: "createUser" },
        },
      },
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed.paths["/users"])).toEqual([
      "get",
      "post",
      "delete",
      "parameters",
      "summary",
    ]);
  });

  it("sorts path strings alphabetically", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      paths: {
        "/users": { get: { operationId: "getUsers" } },
        "/orders": { get: { operationId: "getOrders" } },
      },
    });
    const result = normalizeSpec(input);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed.paths)).toEqual(["/orders", "/users"]);
  });

  it("produces deterministic output for same spec with different ordering", () => {
    const spec1 = JSON.stringify({
      openapi: "3.1.0",
      info: { title: "API", version: "1.0" },
      paths: { "/users": { get: { operationId: "getUsers" } } },
    });
    const spec2 = JSON.stringify({
      paths: { "/users": { get: { operationId: "getUsers" } } },
      info: { version: "1.0", title: "API" },
      openapi: "3.1.0",
    });
    expect(normalizeSpec(spec1)).toBe(normalizeSpec(spec2));
  });

  it("throws on invalid content", () => {
    expect(() => normalizeSpec("not valid yaml")).toThrow("Invalid spec content");
  });
});
