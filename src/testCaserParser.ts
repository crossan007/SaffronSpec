import * as fs from 'fs';
import * as glob from 'glob';
import * as yaml from 'yaml';

export interface TestCase {
  filename: string;
  componentName: string;
  moduleName: string;
  feature: string;
  testDescription: string;
  unitTestCoverage: string;
  manualTestingResults: string;
  ableToReplicate: boolean;
  notes: string;
  needsDocumentation: boolean;
  jiraReferences: string[];
  slackThreads: string[];
}

export function parseTestCases(baseDirectory: string): TestCase[] {
  // Get all JavaScript and TypeScript files in the base directory.
  const files = glob.sync(`${baseDirectory}/**/*.{js,ts}`, {
    nodir: true
  });

  const testCases: TestCase[] = [];

  files.forEach((filename) => {
    // Read the file content.
    const content = fs.readFileSync(filename, 'utf-8');

    // Regular expression to find blocks of comments with @Saffron header
    const testCaseRegex = /@Saffron\s*\r?\n(?:\s*\*\s*(.*\r?\n)*)+?\s?\*\//g;

    // Find all matches in the file.
    const matches = content.match(testCaseRegex);

    if (matches) {
      matches.forEach((match) => {
        // Remove comment characters and @Saffron header.
        const yamlChunk = match
          .replace(/@Saffron/, '')
          .replace(/\s*\*\s*/g, '\n')
          .replace(/^\s?\*?\/$/gm,'')
          .trim();

        // Parse the YAML chunk into a JSON object.
        const testCaseData: Partial<TestCase> = yaml.parse(yamlChunk);

        // Add filename to the test case data.
        testCaseData.filename = filename;

        // Validate and handle data issues...

        // Push the test case data to the array.
        testCases.push(testCaseData as TestCase);
      });
    }
  });

  return testCases;
}
