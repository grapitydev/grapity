import fs from "node:fs";
import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";

const DATE = ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier("Date")
);

const ast = await openapiTS(new URL("../openapi.yaml", import.meta.url), {
  transform(schemaObject) {
    if (schemaObject.format === "date-time") {
      return DATE;
    }
  },
});

const contents = astToString(ast);
fs.writeFileSync(
  new URL("../src/generated/api.ts", import.meta.url),
  contents
);
console.log("Generated types written to src/generated/api.ts");
