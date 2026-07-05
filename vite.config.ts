import * as fsPromises from "fs/promises";
import { defineConfig, type Plugin } from "vite";

const moduleVersion = process.env.MODULE_VERSION;
const githubProject = process.env.GH_PROJECT;
const githubTag = process.env.GH_TAG;

export default defineConfig({
  build: {
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "src/module.ts",
      output: {
        entryFileNames: "scripts/module.js",
        format: "es",
      },
    },
  },
  plugins: [updateModuleManifestPlugin()],
});

// Write dist/module.json. Locally it's a plain copy (symlink dist into Foundry's
// Data/modules for dev); in CI the env vars inject the release version and the
// GitHub manifest/download URLs so the module is installable from the release.
function updateModuleManifestPlugin(): Plugin {
  return {
    name: "update-module-manifest",
    async writeBundle(): Promise<void> {
      const pkg = JSON.parse(await fsPromises.readFile("package.json", "utf-8")) as Record<
        string,
        unknown
      >;
      const manifest = JSON.parse(await fsPromises.readFile("src/module.json", "utf-8")) as Record<
        string,
        unknown
      >;
      manifest.version = moduleVersion ?? (pkg.version as string);
      if (githubProject) {
        const base = `https://github.com/${githubProject}/releases`;
        manifest.manifest = `${base}/latest/download/module.json`;
        if (githubTag) manifest.download = `${base}/download/${githubTag}/module.zip`;
      }
      await fsPromises.writeFile("dist/module.json", JSON.stringify(manifest, null, 2));
    },
  };
}
