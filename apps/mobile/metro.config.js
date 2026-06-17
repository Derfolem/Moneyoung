const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Permite que o Metro resolva módulos da raiz do monorepo
// quando não encontrados em apps/mobile/node_modules
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) =>
      path.join(monorepoRoot, "node_modules", name.toString()),
  }
);

module.exports = config;
