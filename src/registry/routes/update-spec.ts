import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";
import type { components } from "core";

type UpdateBody = Partial<components["schemas"]["UpdateSpecRequest"]>;

export const updateSpecRoute = new Hono<AppEnv>().patch("/:name", async (c) => {
  let body: UpdateBody;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { error: "bad_request", message: "Request body must be valid JSON", statusCode: 400 },
      400
    );
  }

  if (!body.visibility || typeof body.visibility !== "string") {
    return c.json(
      { error: "bad_request", message: "Missing required field: visibility", statusCode: 400 },
      400
    );
  }

  if (body.visibility !== "private" && body.visibility !== "public") {
    return c.json(
      {
        error: "bad_request",
        message: `Unknown visibility value: ${body.visibility}. Known values: private, public`,
        statusCode: 400,
      },
      400
    );
  }

  const name = c.req.param("name");
  const store = c.get("store");
  const service = new RegistryService(store);

  const spec = await service.updateSpec(
    name,
    { visibility: body.visibility },
    c.get("actor")
  );

  if (!spec) {
    return c.json(
      { error: "not_found", message: `Spec "${name}" not found`, statusCode: 404 },
      404
    );
  }

  return c.json({ data: { spec } }, 200);
});
