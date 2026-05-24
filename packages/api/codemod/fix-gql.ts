import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

const sourceFile = project.addSourceFileAtPath('src/gql/graphql.ts');

let changed = false;

// ix 1: import { ... } from "graphql" → import type { ... } from "graphql"
for (const declaration of sourceFile.getImportDeclarations()) {
  if (declaration.getModuleSpecifierValue() === 'graphql' && !declaration.isTypeOnly()) {
    declaration.setIsTypeOnly(true);
    changed = true;
  }
}

if (changed) {
  console.log(`Fixed: ${sourceFile.getFilePath()}`);
  sourceFile.saveSync();
}
