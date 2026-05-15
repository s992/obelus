import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

const sourceFiles = project.addSourceFilesAtPaths('src/sqlc/*.ts');

for (const sourceFile of sourceFiles) {
  let changed = false;

  // ix 1: import { ... } from "pg" → import type { ... } from "pg"
  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.getModuleSpecifierValue() === 'pg' && !declaration.isTypeOnly()) {
      declaration.setIsTypeOnly(true);
      changed = true;
    }
  }

  // add ?. to element accesses where the expression could be null/undefined
  // fixes unsafe row[n] access
  for (const access of sourceFile.getDescendantsOfKind(SyntaxKind.ElementAccessExpression)) {
    if (access.hasQuestionDotToken()) {
      continue;
    }

    const type = access.getExpression().getType();

    if (type.isNullable()) {
      access.setHasQuestionDotToken(true);
      changed = true;
    }
  }

  if (changed) {
    console.log(`Fixed: ${sourceFile.getFilePath()}`);
    sourceFile.saveSync();
  }
}
