import { describe, it, expect } from "bun:test";
import { parseOpenAPI } from "hub/lib/parseOpenAPI";

describe("parseOpenAPI", () => {
  it("parses allOf schemas by merging properties from all sub-schemas", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          post: {
            operationId: "testPost",
            tags: ["test"],
            summary: "Test endpoint",
            responses: {
              "409": {
                description: "Breaking change detected",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/BreakingChangeError",
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
          ApiError: {
            type: "object",
            required: ["error", "message", "statusCode"],
            properties: {
              error: { type: "string", examples: ["breaking_change"] },
              message: { type: "string", examples: ["Breaking changes detected"] },
              statusCode: { type: "integer", examples: [409] },
            },
          },
          CompatReport: {
            type: "object",
            required: ["previousVersion", "classification", "breakingChanges", "safeChanges"],
            properties: {
              previousVersion: { type: "string", examples: ["1.1.0"] },
              classification: { type: "string", examples: ["major"] },
              breakingChanges: { type: "array", items: { type: "object" } },
              safeChanges: { type: "array", items: { type: "object" } },
            },
          },
          BreakingChangeError: {
            allOf: [
              { $ref: "#/components/schemas/ApiError" },
              {
                type: "object",
                required: ["compatReport"],
                properties: {
                  compatReport: { $ref: "#/components/schemas/CompatReport" },
                },
              },
            ],
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    expect(result).toHaveLength(1);
    const endpoint = result[0].endpoints[0];
    expect(endpoint.responses).toHaveLength(1);

    const response409 = endpoint.responses.find((r) => r.status === "409")!;
    expect(response409.properties).toBeDefined();
    expect(response409.properties).toHaveLength(4);

    const names = response409.properties!.map((p) => p.name);
    expect(names).toContain("error");
    expect(names).toContain("message");
    expect(names).toContain("statusCode");
    expect(names).toContain("compatReport");

    const compatReportProp = response409.properties!.find((p) => p.name === "compatReport")!;
    expect(compatReportProp.properties).toBeDefined();
    expect(compatReportProp.properties).toHaveLength(4);
  });

  it("parses allOf with nested object properties directly", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      allOf: [
                        {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                          },
                        },
                        {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                          },
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
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    const response200 = endpoint.responses.find((r) => r.status === "200")!;
    expect(response200.properties).toBeDefined();
    expect(response200.properties).toHaveLength(2);
    expect(response200.properties!.map((p) => p.name)).toEqual(["id", "name"]);
  });

  it("handles deeply nested allOf schemas", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      allOf: [
                        {
                          type: "object",
                          properties: {
                            base: { type: "string" },
                          },
                        },
                        {
                          allOf: [
                            {
                              type: "object",
                              properties: {
                                nested1: { type: "string" },
                              },
                            },
                            {
                              type: "object",
                              properties: {
                                nested2: { type: "string" },
                              },
                            },
                          ],
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
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    const response200 = endpoint.responses.find((r) => r.status === "200")!;
    expect(response200.properties).toBeDefined();
    expect(response200.properties).toHaveLength(3);
    const names = response200.properties!.map((p) => p.name);
    expect(names).toContain("base");
    expect(names).toContain("nested1");
    expect(names).toContain("nested2");
  });

  it("renders $ref to string enum as string instead of object", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          post: {
            operationId: "testPost",
            responses: {
              "201": {
                description: "Created",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        type: { $ref: "#/components/schemas/SpecType" },
                        classification: { $ref: "#/components/schemas/VersionClassification" },
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
          SpecType: {
            type: "string",
            enum: ["openapi", "asyncapi"],
          },
          VersionClassification: {
            type: "string",
            enum: ["initial", "major", "minor", "patch"],
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    const response201 = endpoint.responses.find((r) => r.status === "201")!;
    expect(response201.properties).toBeDefined();
    expect(response201.properties).toHaveLength(2);

    const typeProp = response201.properties!.find((p) => p.name === "type")!;
    expect(typeProp.type).toBe("string (openapi, asyncapi)");
    expect(typeProp.properties).toBeUndefined();

    const classificationProp = response201.properties!.find((p) => p.name === "classification")!;
    expect(classificationProp.type).toBe("string (initial, major, minor, patch)");
    expect(classificationProp.properties).toBeUndefined();
  });

  it("renders $ref to object with title using the title", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        config: { $ref: "#/components/schemas/GatewayConfig" },
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
          GatewayConfig: {
            title: "GatewayConfig",
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    const response200 = endpoint.responses.find((r) => r.status === "200")!;
    const configProp = response200.properties!.find((p) => p.name === "config")!;
    expect(configProp.type).toBe("GatewayConfig");
    expect(configProp.properties).toBeDefined();
    expect(configProp.properties).toHaveLength(1);
  });

  it("renders array items with $ref to scalar type correctly", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        tags: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Tag" },
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
          Tag: {
            type: "string",
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    const response200 = endpoint.responses.find((r) => r.status === "200")!;
    const tagsProp = response200.properties!.find((p) => p.name === "tags")!;
    expect(tagsProp.type).toBe("array<string>");
  });

  it("derives object type name from $ref path when no title is present", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        changes: {
                          type: "array",
                          items: { $ref: "#/components/schemas/BreakingChange" },
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
          BreakingChange: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    const response200 = endpoint.responses.find((r) => r.status === "200")!;
    const changesProp = response200.properties!.find((p) => p.name === "changes")!;
    expect(changesProp.type).toBe("array<BreakingChange>");
  });

  it("merges inline properties alongside allOf sub-schemas", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        item: {
                          allOf: [{ $ref: "#/components/schemas/Base" }],
                          type: "object",
                          properties: {
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
            properties: {
              id: { type: "string" },
            },
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    const response200 = endpoint.responses.find((r) => r.status === "200")!;
    const itemProp = response200.properties!.find((p) => p.name === "item")!;
    expect(itemProp.type).toBe("Base");
    expect(itemProp.properties).toBeDefined();
    expect(itemProp.properties).toHaveLength(2);
    const names = itemProp.properties!.map((p) => p.name);
    expect(names).toContain("id");
    expect(names).toContain("extra");
  });

  it("resolves $ref in parameter schemas", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            parameters: [
              {
                name: "type",
                in: "query",
                schema: { $ref: "#/components/schemas/SpecType" },
              },
            ],
            responses: {
              "200": { description: "OK" },
            },
          },
        },
      },
      components: {
        schemas: {
          SpecType: {
            type: "string",
            enum: ["openapi", "asyncapi"],
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    expect(endpoint.parameters).toHaveLength(1);
    expect(endpoint.parameters[0].name).toBe("type");
    expect(endpoint.parameters[0].type).toBe("string (openapi, asyncapi)");
  });

  it("inherits global security when operation has no security field", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      security: [{ keycloak: ["specs:read"] }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    expect(endpoint.security).toEqual([{ schemeName: "keycloak", scopes: ["specs:read"] }]);
  });

  it("uses operation-level security over global security", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      security: [{ keycloak: ["specs:read"] }],
      paths: {
        "/test": {
          post: {
            operationId: "testPost",
            security: [{ keycloak: ["specs:write"] }],
            responses: { "201": { description: "Created" } },
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    expect(endpoint.security).toEqual([{ schemeName: "keycloak", scopes: ["specs:write"] }]);
  });

  it("treats empty operation security as public", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      security: [{ keycloak: ["specs:read"] }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            security: [],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    expect(endpoint.security).toBeUndefined();
  });

  it("parses security without scopes", () => {
    const spec = {
      openapi: "3.1.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/test": {
          get: {
            operationId: "testGet",
            security: [{ apiKey: [] }],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    };

    const result = parseOpenAPI(JSON.stringify(spec));
    const endpoint = result[0].endpoints[0];
    expect(endpoint.security).toEqual([{ schemeName: "apiKey", scopes: [] }]);
  });
});
