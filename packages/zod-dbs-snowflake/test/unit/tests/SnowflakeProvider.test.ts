import { createClient } from "../../../src/client.js";
import { SnowflakeProvider } from "../../../src/SnowflakeProvider.js";

vi.mock("../../../src/client.js", () => ({
  createClient: vi.fn(),
}));

describe("SnowflakeProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      end: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("requires database and schemaName and maps basic fields", async () => {
    const provider = new SnowflakeProvider();

    await expect(
      provider.getSchemaInformation({ schemaName: "PUBLIC" } as any),
    ).rejects.toThrow(/database is required/);

    await expect(
      provider.getSchemaInformation({ database: "MYDB" } as any),
    ).rejects.toThrow(/schemaName is required/);
  });

  it("decodes base64 private keys before creating the client", async () => {
    const provider = new SnowflakeProvider();
    const privateKey =
      "-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----";

    await provider.getSchemaInformation({
      account: "account",
      database: "MYDB",
      schemaName: "PUBLIC",
      privateKey: Buffer.from(privateKey).toString("base64"),
      privateKeyPass: "passphrase",
      authenticator: "oauth",
      application: "zod-dbs-test",
    });

    expect(createClient).toHaveBeenCalledWith({
      account: "account",
      database: "MYDB",
      schemaName: "PUBLIC",
      privateKey,
      privateKeyPass: "passphrase",
      authenticator: "oauth",
      application: "zod-dbs-test",
    });
  });

  it("preserves PEM private keys", async () => {
    const provider = new SnowflakeProvider();
    const privateKey =
      "-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----";

    await provider.getSchemaInformation({
      account: "account",
      database: "MYDB",
      schemaName: "PUBLIC",
      privateKey,
    });

    expect(createClient).toHaveBeenCalledWith({
      account: "account",
      database: "MYDB",
      schemaName: "PUBLIC",
      privateKey,
    });
  });
});
