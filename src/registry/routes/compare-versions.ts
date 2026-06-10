import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";

export const compareVersionsRoute = new Hono<AppEnv>().get(
  "/:name/compare",
  async (c) => {
    const name = c.req.param("name");
    const from = c.req.query("from");
    const to = c.req.query("to");
    const store = c.get("store");
    const service = new RegistryService(store);

    if (!from || !to) {
      return c.json(
        {
          error: "bad_request",
          message: "Query parameters 'from' and 'to' are required",
          statusCode: 400,
        },
        400
      );
    }

    const result = await service.compareVersions(name, from, to);
    if (!result) {
      return c.json(
        {
          error: "not_found",
          message: `Spec or version not found for ${name}`,
          statusCode: 404,
        },
        404
      );
    }

    return c.json({ data: result });
  }
);
