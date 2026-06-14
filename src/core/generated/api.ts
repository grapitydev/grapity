export interface paths {
    "/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health check */
        get: operations["getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all specs */
        get: operations["listSpecs"];
        put?: never;
        /**
         * Push a spec version
         * @description Push a new spec version to the registry. On the first push for a given name, the spec is created. On subsequent pushes, the spec is diffed against the previous version. Breaking changes are blocked unless `force: true` is provided with a reason.
         */
        post: operations["pushSpec"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a spec and its latest version */
        get: operations["getSpec"];
        put?: never;
        post?: never;
        /**
         * Delete a spec and all its versions
         * @description Deletes a spec and all associated versions from the registry. This action is permanent and cannot be undone. The operation is recorded in the audit log.
         */
        delete: operations["deleteSpec"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Validate a spec without pushing
         * @description Validates the spec content and checks backward compatibility against the latest registered version for this name. Does not store anything.
         */
        post: operations["validateSpec"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all versions of a spec
         * @description Returns versions ordered newest first.
         */
        get: operations["listVersions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/versions/{semver}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a specific version */
        get: operations["getVersion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/spec.json": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get the latest spec as JSON
         * @description Returns the latest version of the spec document as a parsed JSON object. The spec is converted to JSON regardless of the format it was pushed in. Content-Type reflects the spec type (OpenAPI or AsyncAPI).
         */
        get: operations["getSpecJson"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/spec.yaml": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get the latest spec as YAML
         * @description Returns the latest version of the spec document as YAML text. The spec is converted to YAML regardless of the format it was pushed in. Content-Type reflects the spec type (OpenAPI or AsyncAPI).
         */
        get: operations["getSpecYaml"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/versions/{semver}/spec.json": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a specific version as JSON */
        get: operations["getVersionSpecJson"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/versions/{semver}/spec.yaml": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a specific version as YAML */
        get: operations["getVersionSpecYaml"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/compat/{semver}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get the compatibility report for a version
         * @description Returns the compatibility report generated when this version was pushed. Not available for the first version of a spec (no previous version to diff against).
         */
        get: operations["getCompatReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/specs/{name}/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Compare two versions of a spec
         * @description Returns an incremental comparison between two versions. All versions between the two endpoints are included, ordered oldest to newest. The response contains the precomputed compatibility report for each step.
         */
        get: operations["compareVersions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/gateway-configs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all gateway configurations */
        get: operations["listGatewayConfigs"];
        put?: never;
        /**
         * Push a gateway configuration version
         * @description Push a new gateway configuration version. On the first push for a given name, the config is created. On subsequent pushes, a new version is added and old versions are retained (up to 5).
         */
        post: operations["pushGatewayConfig"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/gateway-configs/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a gateway configuration */
        get: operations["getGatewayConfig"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/gateway-configs/{name}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all versions of a gateway configuration */
        get: operations["listGatewayConfigVersions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/gateway-configs/{name}/versions/{versionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a specific gateway configuration version */
        get: operations["getGatewayConfigVersion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/gateway-logs/ingest/{provider}/{environment}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Ingest a gateway access log
         * @description Ingest a raw gateway access log entry. The payload format depends on the provider. For Kong, expects a Kong HTTP log payload.
         */
        post: operations["ingestGatewayLog"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/gateway-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Query gateway access logs */
        get: operations["listGatewayLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/gateway-logs/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get gateway log usage statistics */
        get: operations["getGatewayLogStats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/gateway-logs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a single gateway log entry */
        get: operations["getGatewayLog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        SpecListItem: {
            latestVersion?: components["schemas"]["SpecVersion"];
        } & components["schemas"]["Spec"];
        ListSpecsResponse: {
            data: components["schemas"]["SpecListItem"][];
        };
        PaginationMeta: {
            /** @example true */
            hasMore: boolean;
            /** @example 10 */
            limit: number;
            /** @example 0 */
            offset: number;
            /**
             * @description Total number of items
             * @example 42
             */
            total: number;
        };
        /** @enum {string} */
        SpecType: "openapi" | "asyncapi";
        /** @enum {string} */
        VersionClassification: "initial" | "major" | "minor" | "patch";
        Spec: {
            /**
             * Format: uuid
             * @example a1b2c3d4-e5f6-7890-abcd-ef1234567890
             */
            id: string;
            /** @example payments-api */
            name: string;
            type: components["schemas"]["SpecType"];
            /** @example Payments service API */
            description?: string;
            /** @example platform-team */
            owner?: string;
            /**
             * Format: uri
             * @example https://github.com/acme/payments-service
             */
            sourceRepo?: string;
            /**
             * @example [
             *       "payments",
             *       "public"
             *     ]
             */
            tags: string[];
            /**
             * Format: date-time
             * @example 2026-04-25T10:30:00.000Z
             */
            createdAt: Date;
            /**
             * Format: date-time
             * @example 2026-06-07T14:00:00.000Z
             */
            updatedAt: Date;
        };
        SpecVersion: {
            /**
             * Format: uuid
             * @example ver-uuid-1
             */
            id: string;
            /**
             * Format: uuid
             * @example a1b2c3d4-e5f6-7890-abcd-ef1234567890
             */
            specId: string;
            /** @example 1.2.0 */
            semver: string;
            /**
             * @description SHA-256 hash of the content
             * @example sha256-abc123...
             */
            checksum: string;
            /**
             * @description Git commit SHA at time of push
             * @example a1b2c3d4
             */
            gitRef?: string;
            /**
             * @description User or CI identity that pushed this version
             * @example github-actions[bot]
             */
            pushedBy?: string;
            compatibility?: components["schemas"]["CompatReport"];
            /**
             * @description Semver of the previous version this was diffed against
             * @example 1.1.0
             */
            previousVersion?: string;
            /**
             * @description Reason provided when force-pushing a breaking change
             * @example security fix CVE-2026-1234
             */
            forceReason?: string;
            /** @example false */
            isPrerelease: boolean;
            /**
             * Format: date-time
             * @example 2026-06-07T14:00:00.000Z
             */
            createdAt: Date;
        };
        CompatReport: {
            /** @example 1.1.0 */
            previousVersion: string;
            classification: components["schemas"]["VersionClassification"];
            breakingChanges: components["schemas"]["BreakingChange"][];
            safeChanges: components["schemas"]["SafeChange"][];
            /**
             * @description The version the registry suggests based on the classification
             * @example 2.0.0
             */
            suggestedVersion?: string;
        };
        /** BreakingChange */
        BreakingChange: {
            /** @example chg-2 */
            id: string;
            /**
             * @description Machine-readable rule identifier. Treat as an open string — new rules will be added as the compat engine evolves. Known values: endpoint-removed, endpoint-removed-without-deprecation, endpoint-removed-missing-sunset, endpoint-removed-before-sunset, required-request-param-added, response-property-removed, response-status-removed, stable-endpoint-marked-draft.
             * @example response-property-removed
             */
            rule: string;
            /** @example Response property 'userId' was removed from GET /users/{id} */
            description: string;
            /** @example /users/{id}/GET/response/200/userId */
            path: string;
            /**
             * @example structural
             * @enum {string}
             */
            category: "structural" | "documentation";
            /** @example string */
            originalValue?: string;
            /** @example null */
            newValue?: string;
            /**
             * @example [
             *       "mobile-app",
             *       "web-portal"
             *     ]
             */
            affectedConsumers?: string[];
        };
        /** SafeChange */
        SafeChange: {
            /** @example chg-1 */
            id: string;
            /**
             * @description Machine-readable rule identifier. Treat as an open string — new rules will be added as the compat engine evolves. Known values: endpoint-added, endpoint-deprecated, optional-request-param-added, response-status-added, draft-endpoint-changed.
             * @example endpoint-added
             */
            rule: string;
            /** @example Optional response property 'metadata' added to GET /users/{id} */
            description: string;
            /** @example /users/{id}/GET/response/200/metadata */
            path: string;
            /**
             * @example structural
             * @enum {string}
             */
            category: "structural" | "documentation";
        };
        ApiError: {
            /**
             * @description Machine-readable error code
             * @example not_found
             */
            error: string;
            /**
             * @description Human-readable error description
             * @example Spec "payments-api" not found
             */
            message: string;
            /** @example 404 */
            statusCode: number;
        };
        BreakingChangeError: components["schemas"]["ApiError"] & {
            compatReport: components["schemas"]["CompatReport"];
        };
        HealthResponse: {
            /** @enum {string} */
            status: "ok";
            /** @example 0.2.0 */
            version: string;
            /**
             * @description Server uptime in seconds
             * @example 3600.42
             */
            uptime: number;
        };
        PushSpecRequest: {
            /**
             * @description Raw OpenAPI or AsyncAPI document (YAML or JSON)
             * @example openapi: 3.1.0
             *     info:
             *       title: Payments API
             *       version: 1.0.0
             */
            content: string;
            /** @example payments-api */
            name: string;
            type?: components["schemas"]["SpecType"];
            /** @example Payments service API */
            description?: string;
            /** @example platform-team */
            owner?: string;
            /** Format: uri */
            sourceRepo?: string;
            /**
             * @example [
             *       "payments",
             *       "public"
             *     ]
             */
            tags?: string[];
            /**
             * @description Git commit SHA
             * @example a1b2c3d4
             */
            gitRef?: string;
            /**
             * @description User or CI identity performing the push
             * @example github-actions[bot]
             */
            pushedBy?: string;
            /**
             * @description Push as a prerelease version (0.x)
             * @default false
             */
            prerelease: boolean;
            /**
             * @description Override breaking change block. Requires `reason`.
             * @default false
             */
            force: boolean;
            /**
             * @description Required when `force` is true. Recorded in the audit log.
             * @example security fix CVE-2026-1234
             */
            reason?: string;
        };
        PushSpecResponse: {
            data: {
                compatReport: components["schemas"]["CompatReport"];
                /** @description True if this is the first version of this spec */
                isNewSpec: boolean;
                spec: components["schemas"]["Spec"];
                version: components["schemas"]["SpecVersion"];
            };
        };
        ValidateSpecRequest: {
            /**
             * @description Raw OpenAPI or AsyncAPI document (YAML or JSON)
             * @example openapi: 3.1.0
             *     info:
             *       title: Payments API
             *       version: 1.0.0
             */
            content: string;
        };
        ValidateSpecResponse: {
            data: {
                compatReport?: components["schemas"]["CompatReport"];
                errors?: string[];
                valid: boolean;
                warnings?: string[];
            };
        };
        GetSpecResponse: {
            data: {
                latestVersion?: components["schemas"]["SpecVersion"];
                spec: components["schemas"]["Spec"];
            };
        };
        VersionsPage: {
            data: components["schemas"]["SpecVersion"][];
            pagination: components["schemas"]["PaginationMeta"];
        };
        GetVersionResponse: {
            data: components["schemas"]["SpecVersion"];
        };
        GetCompatReportResponse: {
            data: components["schemas"]["CompatReport"];
        };
        CompareStep: {
            /** @example 1.1.0 */
            version: string;
            /** @example 1.0.0 */
            previousVersion: string;
            classification: components["schemas"]["VersionClassification"];
            breakingChanges: components["schemas"]["BreakingChange"][];
            safeChanges: components["schemas"]["SafeChange"][];
        };
        CompareVersionsResponse: {
            data: {
                /** @example 1.0.0 */
                from: string;
                /** @example 1.3.0 */
                to: string;
                steps: components["schemas"]["CompareStep"][];
            };
        };
        GatewayConfig: {
            /**
             * Format: uuid
             * @example cfg-uuid-1
             */
            id: string;
            /** @example payments-api-gateway */
            name: string;
            /**
             * @example kong
             * @enum {string}
             */
            provider: "kong";
            /** @example payments-api */
            specName: string;
            /** @example 1.2.0 */
            specSemver: string;
            /**
             * Format: date-time
             * @example 2026-04-25T10:30:00.000Z
             */
            createdAt: Date;
            /**
             * Format: date-time
             * @example 2026-06-07T14:00:00.000Z
             */
            updatedAt: Date;
        };
        GatewayRoute: {
            /** @example /payments */
            path: string;
            /**
             * @example [
             *       "GET",
             *       "POST"
             *     ]
             */
            methods: string[];
        };
        GatewayPlugin: {
            /** @example rate-limiting */
            name: string;
            /**
             * @description Plugin-specific configuration
             * @example {
             *       "minute": 1000
             *     }
             */
            config: {
                [key: string]: unknown;
            };
            /**
             * @description Execution order
             * @example 1
             */
            order?: number;
        };
        GatewayEnvironment: {
            /** @example staging */
            name: string;
            /** @example http://kong-staging:8001 */
            kongAddr: string;
            /** @example http://payments-staging:8080 */
            upstream: string;
            plugins: components["schemas"]["GatewayPlugin"][];
        };
        CallerIdentificationRule: {
            /** @example header:x-consumer-id */
            source: string;
            /**
             * @example high
             * @enum {string}
             */
            confidence: "high" | "medium" | "low" | "anonymous";
        };
        CallerIdentification: {
            /**
             * @example first-match
             * @enum {string}
             */
            strategy: "first-match";
            rules: components["schemas"]["CallerIdentificationRule"][];
        };
        GatewayConfigVersion: {
            /**
             * Format: uuid
             * @example ver-uuid-1
             */
            id: string;
            /**
             * Format: uuid
             * @example cfg-uuid-1
             */
            gatewayConfigId: string;
            routes: components["schemas"]["GatewayRoute"][];
            environments: components["schemas"]["GatewayEnvironment"][];
            callerIdentification?: components["schemas"]["CallerIdentification"];
            /**
             * @description Raw gateway config document
             * @example apiVersion: v1
             *     kind: GatewayConfig
             */
            content: string;
            /**
             * @description SHA-256 hash of the content
             * @example sha256-abc123...
             */
            checksum: string;
            /** @example github-actions[bot] */
            pushedBy?: string;
            /**
             * Format: date-time
             * @example 2026-06-07T14:00:00.000Z
             */
            createdAt: Date;
        };
        /** @description Gateway config version without the content field */
        PublicGatewayConfigVersion: {
            /** @description Content is omitted in list responses to keep them lightweight */
            content?: string | null;
        } & components["schemas"]["GatewayConfigVersion"];
        PushGatewayConfigRequest: {
            /** @example payments-api-gateway */
            name: string;
            /**
             * @example kong
             * @enum {string}
             */
            provider: "kong";
            /** @example payments-api */
            specName: string;
            /** @example 1.2.0 */
            specSemver: string;
            routes: components["schemas"]["GatewayRoute"][];
            /**
             * @example {
             *       "staging": {
             *         "name": "staging",
             *         "kongAddr": "http://kong-staging:8001",
             *         "upstream": "http://payments-staging:8080",
             *         "plugins": [
             *           {
             *             "name": "rate-limiting",
             *             "config": {
             *               "minute": 1000
             *             },
             *             "order": 1
             *           }
             *         ]
             *       }
             *     }
             */
            environments: {
                [key: string]: {
                    name: string;
                    kongAddr: string;
                    upstream: string;
                    plugins: components["schemas"]["GatewayPlugin"][];
                };
            };
            callerIdentification?: components["schemas"]["CallerIdentification"];
            /**
             * @description Raw gateway config document
             * @example apiVersion: v1
             *     kind: GatewayConfig
             */
            content: string;
            /** @example github-actions[bot] */
            pushedBy?: string;
        };
        PushGatewayConfigResponse: {
            data: {
                config: components["schemas"]["GatewayConfig"];
                version: components["schemas"]["GatewayConfigVersion"];
            };
        };
        ListGatewayConfigsResponse: {
            data: components["schemas"]["GatewayConfig"][];
        };
        GetGatewayConfigResponse: {
            data: components["schemas"]["GatewayConfig"];
        };
        ListGatewayConfigVersionsResponse: {
            data: components["schemas"]["PublicGatewayConfigVersion"][];
        };
        GetGatewayConfigVersionResponse: {
            data: components["schemas"]["GatewayConfigVersion"];
        };
        GatewayLog: {
            /**
             * Format: uuid
             * @example log-uuid-1
             */
            id: string;
            /** @example kong */
            provider: string;
            /** @example payments-api-gateway */
            gatewayConfigName: string;
            /** @example staging */
            environment: string;
            /** @example GET */
            method: string;
            /** @example /payments */
            path: string;
            /** @example /payments */
            routePath?: string;
            /** @example 200 */
            status: number;
            /** @example consumer-123 */
            callerId?: string;
            /** @example header:x-consumer-id */
            callerSource?: string;
            /**
             * @example high
             * @enum {string}
             */
            callerConfidence: "high" | "medium" | "low" | "anonymous";
            /**
             * Format: date-time
             * @example 2026-06-07T14:00:00.000Z
             */
            occurredAt: Date;
            /**
             * Format: date-time
             * @example 2026-06-07T14:00:01.000Z
             */
            createdAt: Date;
        };
        ListGatewayLogsResponse: {
            data: components["schemas"]["GatewayLog"][];
            pagination: components["schemas"]["PaginationMeta"];
        };
        GatewayLogStatEntry: {
            /** @example payments-api-gateway */
            gatewayConfigName: string;
            /** @example staging */
            environment: string;
            /** @example GET */
            method: string;
            /** @example /payments */
            routePath: string;
            /**
             * Format: date-time
             * @example 2026-06-07T14:00:00.000Z
             */
            lastSeenAt: Date;
            /** @example 15042 */
            totalCalls: number;
            /** @example 128 */
            uniqueCallerIds: number;
        };
        GetGatewayLogStatsResponse: {
            data: components["schemas"]["GatewayLogStatEntry"][];
        };
        GetGatewayLogResponse: {
            data: components["schemas"]["GatewayLog"];
        };
    };
    responses: never;
    parameters: {
        /**
         * @description URL-friendly spec identifier
         * @example payments-api
         */
        specName: string;
        /**
         * @description Semantic version
         * @example 1.2.0
         */
        semver: string;
        /**
         * @description URL-friendly gateway config identifier
         * @example payments-api-gateway
         */
        gatewayConfigName: string;
        /**
         * @description Gateway config version UUID
         * @example a1b2c3d4-e5f6-7890-abcd-ef1234567890
         */
        versionId: string;
        /**
         * @description Gateway provider (e.g., kong)
         * @example kong
         */
        provider: string;
        /**
         * @description Deployment environment (e.g., staging, production)
         * @example staging
         */
        environment: string;
        /**
         * @description Gateway log entry UUID
         * @example a1b2c3d4-e5f6-7890-abcd-ef1234567890
         */
        logId: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Server is healthy */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": "ok",
                     *       "version": "0.2.0",
                     *       "uptime": 3600.42
                     *     }
                     */
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listSpecs: {
        parameters: {
            query?: {
                /** @description Filter by spec type */
                type?: components["schemas"]["SpecType"];
                /** @description Filter by owner */
                owner?: string;
                /**
                 * @description Comma-separated list of tags to filter by
                 * @example payments,public
                 */
                tags?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of specs */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *           "name": "payments-api",
                     *           "type": "openapi",
                     *           "description": "Payments service API",
                     *           "owner": "platform-team",
                     *           "sourceRepo": "https://github.com/acme/payments-service",
                     *           "tags": [
                     *             "payments",
                     *             "public"
                     *           ],
                     *           "createdAt": "2026-04-25T10:30:00.000Z",
                     *           "updatedAt": "2026-06-07T14:00:00.000Z",
                     *           "latestVersion": {
                     *             "id": "ver-uuid-1",
                     *             "specId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *             "semver": "1.2.0",
                     *             "checksum": "sha256-abc123",
                     *             "gitRef": "a1b2c3d4",
                     *             "pushedBy": "github-actions[bot]",
                     *             "previousVersion": "1.1.0",
                     *             "isPrerelease": false,
                     *             "createdAt": "2026-06-07T14:00:00.000Z"
                     *           }
                     *         },
                     *         {
                     *           "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
                     *           "name": "notifications-api",
                     *           "type": "asyncapi",
                     *           "description": "Event-driven notifications",
                     *           "owner": "messaging-team",
                     *           "tags": [
                     *             "events",
                     *             "internal"
                     *           ],
                     *           "createdAt": "2026-05-01T09:00:00.000Z",
                     *           "updatedAt": "2026-05-15T11:30:00.000Z",
                     *           "latestVersion": {
                     *             "id": "ver-uuid-2",
                     *             "specId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
                     *             "semver": "0.3.0",
                     *             "checksum": "sha256-def456",
                     *             "isPrerelease": true,
                     *             "createdAt": "2026-05-15T11:30:00.000Z"
                     *           }
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ListSpecsResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    pushSpec: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "content": "openapi: 3.1.0\ninfo:\n  title: Payments API\n  version: 1.0.0\npaths:\n  /payments:\n    get:\n      operationId: listPayments\n      responses:\n        '200':\n          description: OK\n",
                 *       "name": "payments-api",
                 *       "type": "openapi",
                 *       "description": "Payments service API",
                 *       "owner": "platform-team",
                 *       "sourceRepo": "https://github.com/acme/payments-service",
                 *       "tags": [
                 *         "payments",
                 *         "public"
                 *       ],
                 *       "gitRef": "a1b2c3d4",
                 *       "pushedBy": "github-actions[bot]",
                 *       "prerelease": false,
                 *       "force": false
                 *     }
                 */
                "application/json": components["schemas"]["PushSpecRequest"];
            };
        };
        responses: {
            /** @description Spec version registered successfully */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "isNewSpec": false,
                     *         "spec": {
                     *           "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *           "name": "payments-api",
                     *           "type": "openapi",
                     *           "description": "Payments service API",
                     *           "owner": "platform-team",
                     *           "sourceRepo": "https://github.com/acme/payments-service",
                     *           "tags": [
                     *             "payments",
                     *             "public"
                     *           ],
                     *           "createdAt": "2026-04-25T10:30:00.000Z",
                     *           "updatedAt": "2026-06-07T14:00:00.000Z"
                     *         },
                     *         "version": {
                     *           "id": "ver-uuid-3",
                     *           "specId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *           "semver": "1.2.0",
                     *           "checksum": "sha256-ghi789",
                     *           "gitRef": "a1b2c3d4",
                     *           "pushedBy": "github-actions[bot]",
                     *           "previousVersion": "1.1.0",
                     *           "isPrerelease": false,
                     *           "createdAt": "2026-06-07T14:00:00.000Z",
                     *           "compatibility": {
                     *             "previousVersion": "1.1.0",
                     *             "classification": "minor",
                     *             "suggestedVersion": "1.2.0",
                     *             "breakingChanges": [],
                     *             "safeChanges": [
                     *               {
                     *                 "id": "chg-1",
                     *                 "rule": "endpoint-added",
                     *                 "description": "Endpoint GET /payments/{id}/refunds added",
                     *                 "path": "/payments/{id}/refunds/GET"
                     *               }
                     *             ]
                     *           }
                     *         },
                     *         "compatReport": {
                     *           "previousVersion": "1.1.0",
                     *           "classification": "minor",
                     *           "suggestedVersion": "1.2.0",
                     *           "breakingChanges": [],
                     *           "safeChanges": [
                     *             {
                     *               "id": "chg-1",
                     *               "rule": "endpoint-added",
                     *               "description": "Endpoint GET /payments/{id}/refunds added",
                     *               "path": "/payments/{id}/refunds/GET"
                     *             }
                     *           ]
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["PushSpecResponse"];
                };
            };
            /** @description Missing required fields or invalid spec content */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "bad_request",
                     *       "message": "Missing required field: content",
                     *       "statusCode": 400
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Breaking change detected. The spec breaks backward compatibility with the previous version. Use `force: true` with a `reason` to override and create an audit record. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "breaking_change",
                     *       "message": "Breaking changes detected. Use force: true with a reason to override.",
                     *       "statusCode": 409,
                     *       "compatReport": {
                     *         "previousVersion": "1.1.0",
                     *         "classification": "major",
                     *         "suggestedVersion": "2.0.0",
                     *         "breakingChanges": [
                     *           {
                     *             "id": "chg-2",
                     *             "rule": "response-property-removed",
                     *             "description": "Response property 'userId' was removed from GET /users/{id}",
                     *             "path": "/users/{id}/GET/response/200/userId"
                     *           }
                     *         ],
                     *         "safeChanges": []
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["BreakingChangeError"];
                };
            };
            /** @description Prerelease constraint violation. A prerelease version (0.x) cannot be pushed after a release version (1.x+) has already been registered. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "prerelease_constraint",
                     *       "message": "Cannot push pre-release version. payments-api@1.1.0 is already a release version.",
                     *       "statusCode": 422
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getSpec: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Spec metadata and latest version */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "spec": {
                     *           "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *           "name": "payments-api",
                     *           "type": "openapi",
                     *           "description": "Payments service API",
                     *           "owner": "platform-team",
                     *           "sourceRepo": "https://github.com/acme/payments-service",
                     *           "tags": [
                     *             "payments",
                     *             "public"
                     *           ],
                     *           "createdAt": "2026-04-25T10:30:00.000Z",
                     *           "updatedAt": "2026-06-07T14:00:00.000Z"
                     *         },
                     *         "latestVersion": {
                     *           "id": "ver-uuid-1",
                     *           "specId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *           "semver": "1.2.0",
                     *           "checksum": "sha256-abc123",
                     *           "gitRef": "a1b2c3d4",
                     *           "pushedBy": "github-actions[bot]",
                     *           "previousVersion": "1.1.0",
                     *           "isPrerelease": false,
                     *           "createdAt": "2026-06-07T14:00:00.000Z"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["GetSpecResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Spec \"payments-api\" not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    deleteSpec: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Spec deleted successfully */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Spec \"payments-api\" not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    validateSpec: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "content": "openapi: 3.1.0\ninfo:\n  title: Payments API\n  version: 1.0.0\npaths:\n  /payments:\n    get:\n      operationId: listPayments\n      responses:\n        '200':\n          description: OK\n"
                 *     }
                 */
                "application/json": components["schemas"]["ValidateSpecRequest"];
            };
        };
        responses: {
            /** @description Validation result */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "valid": true,
                     *         "compatReport": {
                     *           "previousVersion": "1.1.0",
                     *           "classification": "minor",
                     *           "suggestedVersion": "1.2.0",
                     *           "breakingChanges": [],
                     *           "safeChanges": [
                     *             {
                     *               "id": "chg-1",
                     *               "rule": "endpoint-added",
                     *               "description": "Endpoint GET /payments/{id}/refunds added",
                     *               "path": "/payments/{id}/refunds/GET"
                     *             }
                     *           ]
                     *         },
                     *         "warnings": []
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ValidateSpecResponse"];
                };
            };
            /** @description Missing required fields */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "bad_request",
                     *       "message": "Request body must be valid JSON",
                     *       "statusCode": 400
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Spec \"payments-api\" not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listVersions: {
        parameters: {
            query?: {
                /** @description Maximum number of versions to return */
                limit?: number;
                /** @description Number of versions to skip */
                offset?: number;
            };
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Paginated list of versions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "ver-uuid-1",
                     *           "specId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *           "semver": "1.2.0",
                     *           "checksum": "sha256-abc123",
                     *           "gitRef": "a1b2c3d4",
                     *           "pushedBy": "github-actions[bot]",
                     *           "previousVersion": "1.1.0",
                     *           "isPrerelease": false,
                     *           "createdAt": "2026-06-07T14:00:00.000Z"
                     *         },
                     *         {
                     *           "id": "ver-uuid-0",
                     *           "specId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *           "semver": "1.1.0",
                     *           "checksum": "sha256-old456",
                     *           "gitRef": "b2c3d4e5",
                     *           "pushedBy": "github-actions[bot]",
                     *           "previousVersion": "1.0.0",
                     *           "isPrerelease": false,
                     *           "createdAt": "2026-05-01T09:00:00.000Z"
                     *         }
                     *       ],
                     *       "pagination": {
                     *         "hasMore": false,
                     *         "limit": 10,
                     *         "offset": 0,
                     *         "total": 2
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["VersionsPage"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Spec \"payments-api\" not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getVersion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
                /**
                 * @description Semantic version
                 * @example 1.2.0
                 */
                semver: components["parameters"]["semver"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Version detail including full spec content */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "id": "ver-uuid-1",
                     *         "specId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                     *         "semver": "1.2.0",
                     *         "checksum": "sha256-abc123",
                     *         "gitRef": "a1b2c3d4",
                     *         "pushedBy": "github-actions[bot]",
                     *         "previousVersion": "1.1.0",
                     *         "isPrerelease": false,
                     *         "createdAt": "2026-06-07T14:00:00.000Z"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["GetVersionResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec or version not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Version 9.9.9 not found for spec \"payments-api\"",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getSpecJson: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Spec document as JSON */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.oai.openapi+json": Record<string, never>;
                    "application/vnd.aai.asyncapi+json": Record<string, never>;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Spec \"payments-api\" not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getSpecYaml: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Spec document as YAML */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.oai.openapi+yaml": string;
                    "application/vnd.aai.asyncapi+yaml": string;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Spec \"payments-api\" not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getVersionSpecJson: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
                /**
                 * @description Semantic version
                 * @example 1.2.0
                 */
                semver: components["parameters"]["semver"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Spec document as JSON */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.oai.openapi+json": Record<string, never>;
                    "application/vnd.aai.asyncapi+json": Record<string, never>;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec or version not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Version 9.9.9 not found for spec \"payments-api\"",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getVersionSpecYaml: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
                /**
                 * @description Semantic version
                 * @example 1.2.0
                 */
                semver: components["parameters"]["semver"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Spec document as YAML */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.oai.openapi+yaml": string;
                    "application/vnd.aai.asyncapi+yaml": string;
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec or version not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Version 9.9.9 not found for spec \"payments-api\"",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getCompatReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
                /**
                 * @description Semantic version
                 * @example 1.2.0
                 */
                semver: components["parameters"]["semver"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Compatibility report */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "previousVersion": "1.1.0",
                     *         "classification": "minor",
                     *         "suggestedVersion": "1.2.0",
                     *         "breakingChanges": [],
                     *         "safeChanges": [
                     *           {
                     *             "id": "chg-1",
                     *             "rule": "endpoint-added",
                     *             "description": "Endpoint GET /payments/{id}/refunds added",
                     *             "path": "/payments/{id}/refunds/GET"
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["GetCompatReportResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec, version, or compat report not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Compat report not found for payments-api@1.0.0",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    compareVersions: {
        parameters: {
            query: {
                /**
                 * @description Starting version (inclusive). If newer than `to`, the order is normalized.
                 * @example 1.0.0
                 */
                from: string;
                /**
                 * @description Ending version (inclusive). If older than `from`, the order is normalized.
                 * @example 1.3.0
                 */
                to: string;
            };
            header?: never;
            path: {
                /**
                 * @description URL-friendly spec identifier
                 * @example payments-api
                 */
                name: components["parameters"]["specName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Incremental comparison between versions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "from": "1.0.0",
                     *         "to": "1.3.0",
                     *         "steps": [
                     *           {
                     *             "version": "1.1.0",
                     *             "previousVersion": "1.0.0",
                     *             "classification": "minor",
                     *             "breakingChanges": [],
                     *             "safeChanges": [
                     *               {
                     *                 "id": "chg-1",
                     *                 "rule": "endpoint-added",
                     *                 "description": "Endpoint GET /payments/{id}/refunds added",
                     *                 "path": "/payments/{id}/refunds/GET",
                     *                 "category": "structural"
                     *               }
                     *             ]
                     *           },
                     *           {
                     *             "version": "1.2.0",
                     *             "previousVersion": "1.1.0",
                     *             "classification": "patch",
                     *             "breakingChanges": [],
                     *             "safeChanges": []
                     *           },
                     *           {
                     *             "version": "1.3.0",
                     *             "previousVersion": "1.2.0",
                     *             "classification": "major",
                     *             "breakingChanges": [
                     *               {
                     *                 "id": "chg-2",
                     *                 "rule": "response-property-removed",
                     *                 "description": "Response property 'userId' was removed from GET /users/{id}",
                     *                 "path": "/users/{id}/GET/response/200/userId",
                     *                 "category": "structural"
                     *               }
                     *             ],
                     *             "safeChanges": []
                     *           }
                     *         ]
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["CompareVersionsResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Spec or version not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Version 1.3.0 not found for spec \"payments-api\"",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listGatewayConfigs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of gateway configurations */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "cfg-uuid-1",
                     *           "name": "payments-api-gateway",
                     *           "provider": "kong",
                     *           "specName": "payments-api",
                     *           "specSemver": "1.2.0",
                     *           "createdAt": "2026-04-25T10:30:00.000Z",
                     *           "updatedAt": "2026-06-07T14:00:00.000Z"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ListGatewayConfigsResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    pushGatewayConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "payments-api-gateway",
                 *       "provider": "kong",
                 *       "specName": "payments-api",
                 *       "specSemver": "1.2.0",
                 *       "routes": [
                 *         {
                 *           "path": "/payments",
                 *           "methods": [
                 *             "GET",
                 *             "POST"
                 *           ]
                 *         },
                 *         {
                 *           "path": "/payments/{id}",
                 *           "methods": [
                 *             "GET",
                 *             "PUT",
                 *             "DELETE"
                 *           ]
                 *         }
                 *       ],
                 *       "environments": {
                 *         "staging": {
                 *           "kongAddr": "http://kong-staging:8001",
                 *           "upstream": "http://payments-staging:8080",
                 *           "plugins": [
                 *             {
                 *               "name": "rate-limiting",
                 *               "config": {
                 *                 "minute": 1000
                 *               },
                 *               "order": 1
                 *             },
                 *             {
                 *               "name": "jwt",
                 *               "config": {
                 *                 "issuer": "https://auth.example.com"
                 *               },
                 *               "order": 2
                 *             }
                 *           ]
                 *         }
                 *       },
                 *       "callerIdentification": {
                 *         "strategy": "first-match",
                 *         "rules": [
                 *           {
                 *             "source": "header:x-consumer-id",
                 *             "confidence": "high"
                 *           }
                 *         ]
                 *       },
                 *       "content": "apiVersion: v1\nkind: GatewayConfig",
                 *       "pushedBy": "github-actions[bot]"
                 *     }
                 */
                "application/json": components["schemas"]["PushGatewayConfigRequest"];
            };
        };
        responses: {
            /** @description Gateway configuration version registered successfully */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "config": {
                     *           "id": "cfg-uuid-1",
                     *           "name": "payments-api-gateway",
                     *           "provider": "kong",
                     *           "specName": "payments-api",
                     *           "specSemver": "1.2.0",
                     *           "createdAt": "2026-04-25T10:30:00.000Z",
                     *           "updatedAt": "2026-06-07T14:00:00.000Z"
                     *         },
                     *         "version": {
                     *           "id": "ver-uuid-1",
                     *           "gatewayConfigId": "cfg-uuid-1",
                     *           "routes": [
                     *             {
                     *               "path": "/payments",
                     *               "methods": [
                     *                 "GET",
                     *                 "POST"
                     *               ]
                     *             }
                     *           ],
                     *           "environments": [
                     *             {
                     *               "name": "staging",
                     *               "kongAddr": "http://kong-staging:8001",
                     *               "upstream": "http://payments-staging:8080",
                     *               "plugins": [
                     *                 {
                     *                   "name": "rate-limiting",
                     *                   "config": {
                     *                     "minute": 1000
                     *                   },
                     *                   "order": 1
                     *                 }
                     *               ]
                     *             }
                     *           ],
                     *           "callerIdentification": {
                     *             "strategy": "first-match",
                     *             "rules": [
                     *               {
                     *                 "source": "header:x-consumer-id",
                     *                 "confidence": "high"
                     *               }
                     *             ]
                     *           },
                     *           "content": "apiVersion: v1\nkind: GatewayConfig",
                     *           "checksum": "sha256-abc123",
                     *           "pushedBy": "github-actions[bot]",
                     *           "createdAt": "2026-06-07T14:00:00.000Z"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["PushGatewayConfigResponse"];
                };
            };
            /** @description Missing required fields */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "bad_request",
                     *       "message": "Missing required field: name",
                     *       "statusCode": 400
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Gateway config name already exists with different spec */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "name_exists",
                     *       "message": "Gateway config name 'payments-api-gateway' already exists with a different spec",
                     *       "statusCode": 409
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Validation error (unsupported provider, spec not found, route not found, or no environments) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unsupported_provider",
                     *       "message": "Unsupported provider 'nginx'",
                     *       "statusCode": 422
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getGatewayConfig: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly gateway config identifier
                 * @example payments-api-gateway
                 */
                name: components["parameters"]["gatewayConfigName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Gateway configuration metadata */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "id": "cfg-uuid-1",
                     *         "name": "payments-api-gateway",
                     *         "provider": "kong",
                     *         "specName": "payments-api",
                     *         "specSemver": "1.2.0",
                     *         "createdAt": "2026-04-25T10:30:00.000Z",
                     *         "updatedAt": "2026-06-07T14:00:00.000Z"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["GetGatewayConfigResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Gateway config not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Gateway config \"payments-api-gateway\" not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listGatewayConfigVersions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly gateway config identifier
                 * @example payments-api-gateway
                 */
                name: components["parameters"]["gatewayConfigName"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of gateway config versions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "ver-uuid-1",
                     *           "gatewayConfigId": "cfg-uuid-1",
                     *           "routes": [
                     *             {
                     *               "path": "/payments",
                     *               "methods": [
                     *                 "GET",
                     *                 "POST"
                     *               ]
                     *             }
                     *           ],
                     *           "environments": [
                     *             {
                     *               "name": "staging",
                     *               "kongAddr": "http://kong-staging:8001",
                     *               "upstream": "http://payments-staging:8080",
                     *               "plugins": [
                     *                 {
                     *                   "name": "rate-limiting",
                     *                   "config": {
                     *                     "minute": 1000
                     *                   },
                     *                   "order": 1
                     *                 }
                     *               ]
                     *             }
                     *           ],
                     *           "callerIdentification": {
                     *             "strategy": "first-match",
                     *             "rules": [
                     *               {
                     *                 "source": "header:x-consumer-id",
                     *                 "confidence": "high"
                     *               }
                     *             ]
                     *           },
                     *           "checksum": "sha256-abc123",
                     *           "pushedBy": "github-actions[bot]",
                     *           "createdAt": "2026-06-07T14:00:00.000Z"
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["ListGatewayConfigVersionsResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Gateway config not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Gateway config \"payments-api-gateway\" not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getGatewayConfigVersion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description URL-friendly gateway config identifier
                 * @example payments-api-gateway
                 */
                name: components["parameters"]["gatewayConfigName"];
                /**
                 * @description Gateway config version UUID
                 * @example a1b2c3d4-e5f6-7890-abcd-ef1234567890
                 */
                versionId: components["parameters"]["versionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Gateway configuration version detail */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "id": "ver-uuid-1",
                     *         "gatewayConfigId": "cfg-uuid-1",
                     *         "routes": [
                     *           {
                     *             "path": "/payments",
                     *             "methods": [
                     *               "GET",
                     *               "POST"
                     *             ]
                     *           }
                     *         ],
                     *         "environments": [
                     *           {
                     *             "name": "staging",
                     *             "kongAddr": "http://kong-staging:8001",
                     *             "upstream": "http://payments-staging:8080",
                     *             "plugins": [
                     *               {
                     *                 "name": "rate-limiting",
                     *                 "config": {
                     *                   "minute": 1000
                     *                 },
                     *                 "order": 1
                     *               }
                     *             ]
                     *           }
                     *         ],
                     *         "callerIdentification": {
                     *           "strategy": "first-match",
                     *           "rules": [
                     *             {
                     *               "source": "header:x-consumer-id",
                     *               "confidence": "high"
                     *             }
                     *           ]
                     *         },
                     *         "content": "apiVersion: v1\nkind: GatewayConfig",
                     *         "checksum": "sha256-abc123",
                     *         "pushedBy": "github-actions[bot]",
                     *         "createdAt": "2026-06-07T14:00:00.000Z"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["GetGatewayConfigVersionResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Gateway config or version not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Version ver-uuid-99 not found for gateway config \"payments-api-gateway\"",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    ingestGatewayLog: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Gateway provider (e.g., kong)
                 * @example kong
                 */
                provider: components["parameters"]["provider"];
                /**
                 * @description Deployment environment (e.g., staging, production)
                 * @example staging
                 */
                environment: components["parameters"]["environment"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "service": {
                 *         "name": "payments-api-gateway"
                 *       },
                 *       "request": {
                 *         "method": "GET",
                 *         "uri": "/payments",
                 *         "headers": {
                 *           "x-consumer-id": "consumer-123"
                 *         }
                 *       },
                 *       "response": {
                 *         "status": 200
                 *       },
                 *       "latencies": {
                 *         "request": 42
                 *       }
                 *     }
                 */
                "application/json": Record<string, never>;
            };
        };
        responses: {
            /** @description Log ingested successfully */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "status": "ok"
                     *     }
                     */
                    "application/json": {
                        /** @example ok */
                        status?: string;
                    };
                };
            };
            /** @description Invalid log payload */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "bad_request",
                     *       "message": "Missing service.name in gateway log payload",
                     *       "statusCode": 400
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    listGatewayLogs: {
        parameters: {
            query?: {
                /** @description Filter by gateway config name */
                gatewayConfig?: string;
                /** @description Filter by environment */
                environment?: string;
                /** @description Filter by request path */
                path?: string;
                /** @description Filter by HTTP method */
                method?: string;
                /** @description Filter by response status code */
                status?: number;
                /** @description Start of time range (ISO 8601) */
                from?: Date;
                /** @description End of time range (ISO 8601) */
                to?: Date;
                /** @description Maximum number of logs to return */
                limit?: number;
                /** @description Number of logs to skip */
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Paginated list of gateway logs */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "log-uuid-1",
                     *           "provider": "kong",
                     *           "gatewayConfigName": "payments-api-gateway",
                     *           "environment": "staging",
                     *           "method": "GET",
                     *           "path": "/payments",
                     *           "routePath": "/payments",
                     *           "status": 200,
                     *           "callerId": "consumer-123",
                     *           "callerSource": "header:x-consumer-id",
                     *           "callerConfidence": "high",
                     *           "occurredAt": "2026-06-07T14:00:00.000Z",
                     *           "createdAt": "2026-06-07T14:00:01.000Z"
                     *         }
                     *       ],
                     *       "pagination": {
                     *         "hasMore": false,
                     *         "limit": 50,
                     *         "offset": 0,
                     *         "total": 1
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["ListGatewayLogsResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getGatewayLogStats: {
        parameters: {
            query?: {
                /** @description Filter by gateway config name */
                gatewayConfig?: string;
                /** @description Filter by environment */
                environment?: string;
                /** @description Start of time range (ISO 8601) */
                from?: Date;
                /** @description End of time range (ISO 8601) */
                to?: Date;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Usage statistics grouped by endpoint */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "gatewayConfigName": "payments-api-gateway",
                     *           "environment": "staging",
                     *           "method": "GET",
                     *           "routePath": "/payments",
                     *           "lastSeenAt": "2026-06-07T14:00:00.000Z",
                     *           "totalCalls": 15042,
                     *           "uniqueCallerIds": 128
                     *         }
                     *       ]
                     *     }
                     */
                    "application/json": components["schemas"]["GetGatewayLogStatsResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
    getGatewayLog: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Gateway log entry UUID
                 * @example a1b2c3d4-e5f6-7890-abcd-ef1234567890
                 */
                id: components["parameters"]["logId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Gateway log entry */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": {
                     *         "id": "log-uuid-1",
                     *         "provider": "kong",
                     *         "gatewayConfigName": "payments-api-gateway",
                     *         "environment": "staging",
                     *         "method": "GET",
                     *         "path": "/payments",
                     *         "routePath": "/payments",
                     *         "status": 200,
                     *         "callerId": "consumer-123",
                     *         "callerSource": "header:x-consumer-id",
                     *         "callerConfidence": "high",
                     *         "occurredAt": "2026-06-07T14:00:00.000Z",
                     *         "createdAt": "2026-06-07T14:00:01.000Z"
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["GetGatewayLogResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "unauthorized",
                     *       "message": "Invalid or missing bearer token",
                     *       "statusCode": 401
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Forbidden - missing required scope */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "forbidden",
                     *       "message": "Missing required scope: specs:write",
                     *       "statusCode": 403
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Log entry not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "not_found",
                     *       "message": "Log not found",
                     *       "statusCode": 404
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "error": "internal_error",
                     *       "message": "Internal server error",
                     *       "statusCode": 500
                     *     }
                     */
                    "application/json": components["schemas"]["ApiError"];
                };
            };
        };
    };
}
