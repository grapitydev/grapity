// Generated from openapi.yaml by scripts/generate-types.ts
// Do not edit by hand.

export interface RouteScope {
  method: string;
  path: string;
  operationId: string;
  scopes: string[];
}

export const routeScopes: RouteScope[] = [
  {
    "method": "GET",
    "path": "/v1/health",
    "operationId": "getHealth",
    "scopes": []
  },
  {
    "method": "GET",
    "path": "/v1/specs",
    "operationId": "listSpecs",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "POST",
    "path": "/v1/specs",
    "operationId": "pushSpec",
    "scopes": [
      "specs:write"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name",
    "operationId": "getSpec",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "DELETE",
    "path": "/v1/specs/:name",
    "operationId": "deleteSpec",
    "scopes": [
      "specs:write"
    ]
  },
  {
    "method": "POST",
    "path": "/v1/specs/:name/validate",
    "operationId": "validateSpec",
    "scopes": [
      "specs:write"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name/versions",
    "operationId": "listVersions",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name/versions/:semver",
    "operationId": "getVersion",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name/spec.json",
    "operationId": "getSpecJson",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name/spec.yaml",
    "operationId": "getSpecYaml",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name/versions/:semver/spec.json",
    "operationId": "getVersionSpecJson",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name/versions/:semver/spec.yaml",
    "operationId": "getVersionSpecYaml",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name/compat/:semver",
    "operationId": "getCompatReport",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/specs/:name/compare",
    "operationId": "compareVersions",
    "scopes": [
      "specs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/gateway-configs",
    "operationId": "listGatewayConfigs",
    "scopes": [
      "gateway-configs:read"
    ]
  },
  {
    "method": "POST",
    "path": "/v1/gateway-configs",
    "operationId": "pushGatewayConfig",
    "scopes": [
      "gateway-configs:write"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/gateway-configs/:name",
    "operationId": "getGatewayConfig",
    "scopes": [
      "gateway-configs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/gateway-configs/:name/versions",
    "operationId": "listGatewayConfigVersions",
    "scopes": [
      "gateway-configs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/gateway-configs/:name/versions/:versionId",
    "operationId": "getGatewayConfigVersion",
    "scopes": [
      "gateway-configs:read"
    ]
  },
  {
    "method": "POST",
    "path": "/v1/gateway-logs/ingest/:provider/:environment",
    "operationId": "ingestGatewayLog",
    "scopes": [
      "gateway-logs:write"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/gateway-logs",
    "operationId": "listGatewayLogs",
    "scopes": [
      "gateway-logs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/gateway-logs/stats",
    "operationId": "getGatewayLogStats",
    "scopes": [
      "gateway-logs:read"
    ]
  },
  {
    "method": "GET",
    "path": "/v1/gateway-logs/:id",
    "operationId": "getGatewayLog",
    "scopes": [
      "gateway-logs:read"
    ]
  }
];
