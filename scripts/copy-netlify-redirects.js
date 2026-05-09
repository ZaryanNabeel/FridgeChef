import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const target = join("dist", "_redirects");
const contents = "/* /client/index.html 200\n";

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, contents, "utf8");
