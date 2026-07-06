import fs from 'fs';
import path from 'path';

const sourceDirectory = __dirname;
const forbiddenImportPatterns = [
  /\.\.\/invoice\//,
  /\.\.\/billing\.resource/,
  /\.\.\/types/,
  /billing\.resource/,
  /LineItem/,
  /BillableService/,
  /MappedBill/,
];

const getSourceFiles = (directory: string): Array<string> => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getSourceFiles(entryPath);
    }

    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\./.test(entry.name) || /\.stories\./.test(entry.name)) {
      return [];
    }

    return [entryPath];
  });
};

describe('editable-carbon-table-cell-kit import boundary', () => {
  it('does not import billing app modules or billing domain types', () => {
    for (const sourceFile of getSourceFiles(sourceDirectory)) {
      const contents = fs.readFileSync(sourceFile, 'utf8');

      for (const forbiddenImportPattern of forbiddenImportPatterns) {
        expect(contents).not.toMatch(forbiddenImportPattern);
      }
    }
  });
});
