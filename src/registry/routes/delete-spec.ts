import { Hono } from "hono";
import type { AppEnv } from "../server";
import { RegistryService } from "../services/registry";

export const deleteSpecRoute = new Hono<AppEnv>().delete(
  "/:name",
  async (c) => {
    const name = c.req.param("name");
    const store = c.get("store");
    const service = new RegistryService(store);

    const deleted = await service.deleteSpec(name);
    if (!deleted) {
      return c.json({ error: "not_found", message: `Spec "${name}" not found`, statusCode: 404 }, 404);
    }

    return new Response(null, { status: 204 });
  }
);
