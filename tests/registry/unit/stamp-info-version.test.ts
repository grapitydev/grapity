import { describe, it, expect } from "bun:test";
import yaml from "js-yaml";
import { stampInfoVersion } from "registry/utils/stamp-info-version";

describe("stampInfoVersion", () => {
  it("replaces info.version in a JSON document and returns JSON", () => {
    const input = JSON.stringify({
      openapi: "3.1.0",
      info: { title: "Test API", version: "0.0.0" },
      paths: {},
    });

    const output = stampInfoVersion(input, "1.2.0");

    expect(output.trimStart().startsWith("{")).toBe(true);
    const parsed = JSON.parse(output);
    expect(parsed.info.version).toBe("1.2.0");
    expect(parsed.info.title).toBe("Test API");
    expect(parsed.openapi).toBe("3.1.0");
  });

  it("replaces info.version in a YAML document and returns YAML", () => {
    const input = [
      "openapi: 3.1.0",
      "info:",
      "  title: Test API",
      "  version: 0.0.0",
      "paths: {}",
      "",
    ].join("\n");

    const output = stampInfoVersion(input, "2.0.0");

    expect(output.trimStart().startsWith("{")).toBe(false);
    const parsed = yaml.load(output) as any;
    expect(parsed.info.version).toBe("2.0.0");
    expect(parsed.info.title).toBe("Test API");
  });

  it("adds an info object when the document has none", () => {
    const input = JSON.stringify({ openapi: "3.1.0", paths: {} });

    const parsed = JSON.parse(stampInfoVersion(input, "1.0.0"));

    expect(parsed.info.version).toBe("1.0.0");
  });

  it("returns the content unchanged when it is not an object", () => {
    const input = "just a plain string";

    expect(stampInfoVersion(input, "1.0.0")).toBe(input);
  });
});
