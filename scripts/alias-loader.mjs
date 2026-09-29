import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const extensions = [".ts", ".tsx", ".js", ".mjs"];

async function existingUrl(absolutePath) {
  const directCandidates = [
    absolutePath,
    ...extensions.map((extension) => `${absolutePath}${extension}`),
    ...extensions.map((extension) => path.join(absolutePath, `index${extension}`)),
  ];

  for (const candidate of directCandidates) {
    try {
      await access(candidate);
      return pathToFileURL(candidate).href;
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === "next/server") return defaultResolve("next/server.js", context, defaultResolve);
  if (specifier.startsWith("@/")) {
    const mapped = await existingUrl(path.join(sourceRoot, specifier.slice(2)));

    if (mapped) {
      return {
        shortCircuit: true,
        url: mapped,
      };
    }
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : projectRoot;
    const mapped = await existingUrl(path.resolve(path.dirname(parentPath), specifier));

    if (mapped) {
      return {
        shortCircuit: true,
        url: mapped,
      };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
