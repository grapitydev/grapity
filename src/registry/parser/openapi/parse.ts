import yaml from "js-yaml";

export interface ParsedSpec {
  openapi?: string;
  paths?: Record<string, Record<string, any>>;
  info?: Record<string, any>;
  servers?: any[];
  security?: any[];
  tags?: any[];
  webhooks?: Record<string, any>;
  externalDocs?: any;
  components?: any;
}

export function parseOpenApiSpec(content: string): ParsedSpec {
  const obj = yaml.load(content);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("Invalid spec content: not a valid YAML/JSON object");
  }
  return obj as ParsedSpec;
}
