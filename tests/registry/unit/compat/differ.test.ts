import { describe, it, expect } from "bun:test";
import { diffSpecs } from "registry/compat-engine/differ";
import type { ParsedSpec } from "registry/parser/openapi/parse";

function makeSpec(overrides: Partial<ParsedSpec> = {}): ParsedSpec {
  return {
    openapi: "3.1.0",
    info: { title: "Test API", version: "1.0.0" },
    paths: {},
    ...overrides,
  };
}

describe("diffSpecs — $ref resolution", () => {
  // ---------------------------------------------------------------------------
  // 1. Response schemas via $ref
  // ---------------------------------------------------------------------------

  it("detects adding a property inside a $ref-ed response schema", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestResponse: {
            type: "object",
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestResponse: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const added = changes.filter((c) => c.type === "response-property-added");
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      path: "/test",
      method: "get",
      statusCode: "200",
      propertyPath: "name",
    });
  });

  it("detects removing a property inside a $ref-ed response schema", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestResponse: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestResponse: {
            type: "object",
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const removed = changes.filter((c) => c.type === "response-property-removed");
    expect(removed).toHaveLength(1);
    expect(removed[0]).toMatchObject({
      path: "/test",
      method: "get",
      statusCode: "200",
      propertyPath: "name",
    });
  });

  it("detects making a property required inside a $ref-ed response schema", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestResponse: {
            type: "object",
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestResponse: {
            type: "object",
            required: ["id"],
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const required = changes.filter((c) => c.type === "response-property-now-required");
    expect(required).toHaveLength(1);
    expect(required[0]).toMatchObject({
      path: "/test",
      method: "get",
      statusCode: "200",
      propertyPath: "id",
    });
  });

  it("detects property type change inside a $ref-ed response schema", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestResponse: {
            type: "object",
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestResponse: {
            type: "object",
            properties: { id: { type: "integer" } },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const typeChanged = changes.filter((c) => c.type === "response-property-type-changed");
    expect(typeChanged).toHaveLength(1);
    expect(typeChanged[0]).toMatchObject({
      path: "/test",
      method: "get",
      statusCode: "200",
      propertyPath: "id",
      oldType: "string",
      newType: "integer",
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Request body schemas via $ref
  // ---------------------------------------------------------------------------

  it("detects adding a required property inside a $ref-ed request body schema", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          post: {
            operationId: "createTest",
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TestRequest" },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
      components: {
        schemas: {
          TestRequest: {
            type: "object",
            properties: { name: { type: "string" } },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          post: {
            operationId: "createTest",
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TestRequest" },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
      components: {
        schemas: {
          TestRequest: {
            type: "object",
            required: ["name"],
            properties: { name: { type: "string" } },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const required = changes.filter((c) => c.type === "request-body-property-now-required");
    expect(required).toHaveLength(1);
    expect(required[0]).toMatchObject({
      path: "/test",
      method: "post",
      propertyPath: "name",
    });
  });

  it("detects removing a property inside a $ref-ed request body schema", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          post: {
            operationId: "createTest",
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TestRequest" },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
      components: {
        schemas: {
          TestRequest: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          post: {
            operationId: "createTest",
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TestRequest" },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
      components: {
        schemas: {
          TestRequest: {
            type: "object",
            properties: { name: { type: "string" } },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const removed = changes.filter((c) => c.type === "request-body-property-removed");
    expect(removed).toHaveLength(1);
    expect(removed[0]).toMatchObject({
      path: "/test",
      method: "post",
      propertyPath: "email",
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Parameter $ref resolution
  // ---------------------------------------------------------------------------

  it("detects parameter type change when parameter uses $ref to components/parameters", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test/{id}": {
          get: {
            operationId: "getTest",
            parameters: [{ $ref: "#/components/parameters/TestId" }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {
        parameters: {
          TestId: {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test/{id}": {
          get: {
            operationId: "getTest",
            parameters: [{ $ref: "#/components/parameters/TestId" }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {
        parameters: {
          TestId: {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const typeChanged = changes.filter((c) => c.type === "param-type-changed");
    expect(typeChanged).toHaveLength(1);
    expect(typeChanged[0]).toMatchObject({
      path: "/test/{id}",
      method: "get",
      paramName: "id",
      paramIn: "path",
      oldType: "string",
      newType: "integer",
    });
  });

  it("detects adding a parameter via $ref", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {},
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            parameters: [{ $ref: "#/components/parameters/Filter" }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {
        parameters: {
          Filter: {
            name: "filter",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const added = changes.filter((c) => c.type === "optional-param-added");
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      path: "/test",
      method: "get",
      paramName: "filter",
      paramIn: "query",
    });
  });

  it("detects removing a parameter via $ref", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            parameters: [{ $ref: "#/components/parameters/Filter" }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {
        parameters: {
          Filter: {
            name: "filter",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {},
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const removed = changes.filter((c) => c.type === "param-removed");
    expect(removed).toHaveLength(1);
    expect(removed[0]).toMatchObject({
      path: "/test",
      method: "get",
      paramName: "filter",
      paramIn: "query",
    });
  });

  // ---------------------------------------------------------------------------
  // 4. allOf composition
  // ---------------------------------------------------------------------------

  it("detects inline property added alongside allOf with $ref", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        item: {
                          allOf: [{ $ref: "#/components/schemas/Base" }],
                          type: "object",
                          properties: { id: { type: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Base: {
            type: "object",
            properties: { name: { type: "string" } },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        item: {
                          allOf: [{ $ref: "#/components/schemas/Base" }],
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            extra: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Base: {
            type: "object",
            properties: { name: { type: "string" } },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const added = changes.filter((c) => c.type === "response-property-added");
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      path: "/test",
      method: "get",
      statusCode: "200",
      propertyPath: "item.extra",
    });
  });

  it("detects required field added via second allOf item", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        item: {
                          allOf: [
                            { $ref: "#/components/schemas/Base" },
                            {
                              type: "object",
                              properties: { extra: { type: "string" } },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Base: {
            type: "object",
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        item: {
                          allOf: [
                            { $ref: "#/components/schemas/Base" },
                            {
                              type: "object",
                              required: ["extra"],
                              properties: { extra: { type: "string" } },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Base: {
            type: "object",
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const required = changes.filter((c) => c.type === "response-property-now-required");
    expect(required).toHaveLength(1);
    expect(required[0]).toMatchObject({
      path: "/test",
      method: "get",
      statusCode: "200",
      propertyPath: "item.extra",
    });
  });

  // ---------------------------------------------------------------------------
  // 5. additionalProperties
  // ---------------------------------------------------------------------------

  it("detects adding a property inside additionalProperties schema", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          post: {
            operationId: "createTest",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      config: {
                        type: "object",
                        additionalProperties: {
                          type: "object",
                          properties: { name: { type: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          post: {
            operationId: "createTest",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      config: {
                        type: "object",
                        additionalProperties: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            value: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    const added = changes.filter((c) => c.type === "request-body-property-added");
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      path: "/test",
      method: "post",
      propertyPath: "config.value",
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Example changes (should be silently ignored)
  // ---------------------------------------------------------------------------

  it("ignores adding an example to a property", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string", example: "abc-123" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    expect(changes).toHaveLength(0);
  });

  it("ignores changing an example value on a property", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string", example: "old-example" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string", example: "new-example" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    expect(changes).toHaveLength(0);
  });

  it("ignores adding examples to response content", () => {
    const oldSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const newSpec = makeSpec({
      paths: {
        "/test": {
          get: {
            operationId: "getTest",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" } },
                    },
                    example: { id: "abc-123" },
                  },
                },
              },
            },
          },
        },
      },
    });

    const changes = diffSpecs(oldSpec, newSpec);
    expect(changes).toHaveLength(0);
  });
});
