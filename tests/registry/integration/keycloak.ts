import { GenericContainer, Wait } from "testcontainers";

export const REALM = "grapity";

export async function fetchToken(
  serverUrl: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const res = await fetch(
    `${serverUrl}/realms/${REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    }
  );
  if (!res.ok) {
    throw new Error(`Token fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function startKeycloak(): Promise<{
  serverUrl: string;
  stop: () => Promise<void>;
}> {
  const container = await new GenericContainer("quay.io/keycloak/keycloak:26.0")
    .withCommand(["start-dev", "--import-realm"])
    .withEnvironment({
      KEYCLOAK_ADMIN: "admin",
      KEYCLOAK_ADMIN_PASSWORD: "admin",
    })
    .withExposedPorts(8080)
    .withCopyFilesToContainer([
      {
        source: "tests/registry/integration/keycloak/realm-export.json",
        target: "/opt/keycloak/data/import/realm-export.json",
      },
    ])
    .withWaitStrategy(Wait.forLogMessage("Running the server in development mode"))
    .start();

  const serverUrl = `http://${container.getHost()}:${container.getMappedPort(8080)}`;

  return {
    serverUrl,
    stop: async () => {
      await container.stop();
    },
  };
}
