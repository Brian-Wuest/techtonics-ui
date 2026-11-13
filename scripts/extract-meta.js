// scripts/extract-meta.js
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// Example path
const componentPath = path.resolve('projects/ui-button/ui-button.component.ts');
const program = ts.createProgram([componentPath], {});
const sourceFile = program.getSourceFile(componentPath);
const checker = program.getTypeChecker();

const metadata = { name: '', inputs: [], outputs: [], slots: [] };

function visit(node) {
  if (
    ts.isClassDeclaration(node) &&
    node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  ) {
    metadata.name = node.name.text;

    node.members.forEach((member) => {
      if (!member.name) return;
      const name = member.name.text;

      // Look for modern input() signals or @Input decorators
      const isInput =
        member.initializer?.expression?.text === 'input' ||
        member.modifiers?.some((m) => m.getText() === '@Input');

      // Look for modern output() signals or @Output decorators
      const isOutput =
        member.initializer?.expression?.text === 'output' ||
        member.modifiers?.some((m) => m.getText() === '@Output');

      if (isInput) {
        const type = checker.typeToString(checker.getTypeAtLocation(member));
        metadata.inputs.push({ name, type });
      }
      if (isOutput) {
        metadata.outputs.push({ name });
      }
    });
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);
fs.writeFileSync('src/assets/metadata.json', JSON.stringify(metadata, null, 2));
