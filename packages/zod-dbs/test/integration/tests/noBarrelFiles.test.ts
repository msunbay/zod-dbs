import fs from "node:fs/promises";
import path from "node:path";

import { generateZodSchemas } from "../../../src/generateZodSchemas.js";
import {
  createTestProvider,
  getOutputDir,
  getOutputFiles,
} from "../testDbUtils.js";

const provider = createTestProvider();

it("generates schemas without barrel files", async () => {
  const outputDir = getOutputDir("noBarrelFiles");

  await generateZodSchemas({
    provider,
    config: {
      outputDir,
      moduleResolution: "esm",
      barrelFiles: false,
      include: ["users"],
    },
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, "utf8");
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
