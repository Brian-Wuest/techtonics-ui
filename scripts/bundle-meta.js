import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// Update to library path if this ever changes!
const LIB_DIR = path.resolve('projects/techtonics-ui');
const outputRegistry = {};

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.component.ts')) {
      extractComponentMetadata(fullPath);
    }
  }
}

function extractComponentMetadata(filePath) {
  const program = ts.createProgram([filePath], {});
  const sourceFile = program.getSourceFile(filePath);
  const checker = program.getTypeChecker();

  const htmlPath = filePath.replace('.component.ts', '.component.html');
  let hasDefaultSlot = false;
  let namedSlots = [];
  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    if (/<ng-content(?!\s+select=)[^>]*>/i.test(htmlContent)) hasDefaultSlot = true;
    const slotMatches = htmlContent.matchAll(/<ng-content\s+select="\[?([^\]"]+)\]?"[^>]*>/gi);
    for (const match of slotMatches) {
      if (match && match[1]) {
        namedSlots.push(match[1].trim());
      }
    }
  }

  function visit(node) {
    if (ts.isClassDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const className = node.name.text;
      const meta = {
        inputs: [],
        outputs: [],
        slots: { default: hasDefaultSlot, named: namedSlots },
        templateChildren: [],
        typeDefinitions: {},
      };

      node.members.forEach((member) => {
        if (!member.name) return;
        const name = member.name.text;
        const memberText = member.getText();
        const description = parseJSDocDescription(member, sourceFile);

        if (memberText.includes('contentChild')) {
          const templateAliasMatch = memberText.match(/contentChild(?:<[^>]+>)?\(['"]([^'"]+)['"]\)/);
          if (templateAliasMatch && templateAliasMatch[1]) {
            meta.templateChildren.push(templateAliasMatch[1].trim());
          }
          return;
        }

        const isInput =
          memberText.includes('input(') ||
          memberText.includes('input.required') ||
          memberText.includes('input<') ||
          memberText.includes('input.required<') ||
          memberText.includes('model(') ||
          memberText.includes('model<') ||
          memberText.includes('model.required<');
        const isOutput = memberText.includes('output(') || memberText.includes('output<');

        if (isInput) {
          const useInput =
            memberText.includes('input(') ||
            memberText.includes('input.required') ||
            memberText.includes('input<') ||
            memberText.includes('input.required<');
          const isRequired = useInput ? memberText.includes('input.required') : memberText.includes('model.required');
          let controlType = 'string';
          let options = [];
          let defaultValue = '';

          // FIX: Access index 1 to pull out ONLY the inner text of the generic match group
          let typeStr = 'any';
          const inputTokenIndex = useInput ? memberText.indexOf('input<') : memberText.indexOf('model<');
          const requiredTokenIndex = useInput
            ? memberText.indexOf('input.required<')
            : memberText.indexOf('model.required<');

          // Detect start point of the opening bracket '<'
          const startBracketIndex =
            inputTokenIndex !== -1 ? inputTokenIndex + 5 : requiredTokenIndex !== -1 ? requiredTokenIndex + 14 : -1;

          if (startBracketIndex !== -1) {
            let bracketDepth = 0;
            let endBracketIndex = -1;

            // Proceed from the identified starting angle bracket down the character stream
            for (let i = startBracketIndex; i < memberText.length; i++) {
              if (memberText[i] === '<') {
                bracketDepth++;
              } else if (memberText[i] === '>') {
                bracketDepth--;
                if (bracketDepth === 0) {
                  endBracketIndex = i;
                  break;
                }
              }
            }

            if (endBracketIndex !== -1) {
              // Extract everything *inside* the outer matching brackets safely (excluding the outer bounds)
              typeStr = memberText.substring(startBracketIndex + 1, endBracketIndex).trim();
            }
          } else {
            // Fallback to basic type checker if no explicit generic is typed out
            const typeObj = checker.getTypeAtLocation(member);
            typeStr = checker
              .typeToString(typeObj)
              .replace(/^InputSignal</, '')
              .replace(/>$/, '');
          }

          const cleanType = typeStr
            .split('|')
            .map((t) => t.trim())
            .filter((t) => t !== 'null' && t !== 'undefined')
            .join(' | ');

          // FIX: Access index 1 to pull out ONLY the fallback assignment value inside the parenthesis
          const valueMatch = useInput
            ? memberText.match(/input(?:\.required)?(?:<[^>]+>)?\(([^)]*)\)/)
            : memberText.match(/model(?:\.required)?(?:<[^>]+>)?\(([^)]*)\)/);

          if (valueMatch && valueMatch[1]) {
            const rawVal = valueMatch[1].trim().replace(/['"]/g, '');
            if (rawVal === 'false') defaultValue = false;
            else if (rawVal === 'true') defaultValue = true;
            else if (!isNaN(rawVal) && rawVal !== '') defaultValue = Number(rawVal);
            else defaultValue = rawVal;
          }

          if (cleanType.includes('[]') || cleanType.includes('Array<') || cleanType.includes('{')) {
            controlType = 'json';
            const itemTypeName = cleanType
              .replace('[]', '')
              .replace(/Array<([^>]+)>/, '$1')
              .trim();

            extractDeepTypeDefinitions(itemTypeName, sourceFile, meta.typeDefinitions);

            if (defaultValue === '' || defaultValue === '[]') {
              if (itemTypeName.toLowerCase().includes('item')) {
                defaultValue = JSON.stringify(
                  [
                    { id: 1, label: 'Home', data: {} },
                    { id: 2, label: 'Components', data: {} },
                  ],
                  null,
                  2,
                );
              } else {
                defaultValue = JSON.stringify([], null, 2);
              }
            }
          } else if (cleanType === 'boolean') {
            controlType = 'boolean';
            if (defaultValue === '') defaultValue = false;
          } else if (cleanType === 'number') {
            controlType = 'number';
            if (defaultValue === '') defaultValue = 0;
          } else if (cleanType.includes('|')) {
            controlType = 'select';
            options = cleanType.split('|').map((t) => t.trim().replace(/['"]/g, ''));
            if (defaultValue === '') defaultValue = options[0]; // Set first enum option as default
          }

          if (defaultValue === 'null') {
            defaultValue = null;
          }

          const recordToPunch = {
            name,
            controlType,
            typeSignature: cleanType,
            isRequired,
            options,
            defaultValue,
            description,
          };

          meta.inputs.push(recordToPunch);
        }

        if (isOutput) {
          const outputTokenIndex = memberText.indexOf('output<');
          const startBracketIndex = outputTokenIndex !== -1 ? outputTokenIndex + 6 : -1;
          let outputType = 'any';

          if (startBracketIndex !== -1) {
            let bracketDepth = 0;
            let endBracketIndex = -1;

            // Proceed from the identified starting angle bracket down the character stream
            for (let i = startBracketIndex; i < memberText.length; i++) {
              if (memberText[i] === '<') {
                bracketDepth++;
              } else if (memberText[i] === '>') {
                bracketDepth--;
                if (bracketDepth === 0) {
                  endBracketIndex = i;
                  break;
                }
              }
            }

            if (endBracketIndex !== -1) {
              // Extract everything *inside* the outer matching brackets safely (excluding the outer bounds)
              outputType = memberText.substring(startBracketIndex + 1, endBracketIndex).trim();
            }
          }

          meta.outputs.push({ name, typeSignature: outputType, description });
        }
      });

      outputRegistry[className] = meta;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function parseJSDocDescription(node, sourceFile) {
  const fileText = sourceFile.text;
  const ranges = ts.getLeadingCommentRanges(fileText, node.getFullStart());
  if (!ranges) return '';

  for (const range of ranges) {
    const commentText = fileText.substring(range.pos, range.end);
    if (commentText.startsWith('/**')) {
      const descMatch = commentText.match(/@description\s+([^*@\n\r]+)/i);
      if (descMatch && descMatch[1]) return descMatch[1].trim();

      const cleanLines = commentText
        .replace(/\/\*\*|\*\/|\*/g, '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('@'));
      if (cleanLines.length > 0) return cleanLines.join(' ');
    }
  }
  return '';
}

function extractDeepTypeDefinitions(typeName, sourceFile, targetRegistry) {
  if (!typeName || ['string', 'number', 'boolean', 'any', 'unknown'].includes(typeName)) return;

  function walk(node) {
    if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) && node.name.text === typeName) {
      const props = [];
      if (ts.isInterfaceDeclaration(node)) {
        node.members.forEach((m) => {
          if (m.name)
            props.push({
              name: m.name.getText(),
              type: m.type ? m.type.getText() : 'any',
              optional: !!m.questionToken,
            });
        });
      }
      targetRegistry[typeName] = props;
    }
    ts.forEachChild(node, walk);
  }
  walk(sourceFile);
}

scanDirectory(LIB_DIR);
fs.writeFileSync('src/assets/component-registry.json', JSON.stringify(outputRegistry, null, 2));
console.log('✓ Fixed Component metadata compilation script complete.');
