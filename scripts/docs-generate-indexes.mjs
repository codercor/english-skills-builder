import path from "node:path";
import {
  buildEnvIndex,
  buildModuleIndex,
  buildRouteIndex,
  buildTableIndex,
  writeJson,
} from "./docs-index-data.mjs";

const outputDir = path.join(process.cwd(), "docs/generated");

writeJson(path.join(outputDir, "route-index.json"), buildRouteIndex());
writeJson(path.join(outputDir, "module-index.json"), buildModuleIndex());
writeJson(path.join(outputDir, "env-index.json"), buildEnvIndex());
writeJson(path.join(outputDir, "table-index.json"), buildTableIndex());

console.log("Generated docs indexes in docs/generated.");
