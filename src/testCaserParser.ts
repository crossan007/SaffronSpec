import * as fs from "fs";
import * as glob from "glob";
import { getLogger } from "loglevel";
import path from "path";
import * as yaml from "yaml";

const log = getLogger("Parser");

export interface TestCase {
  source: string;
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

interface ManualTestFile {
  meta: Partial<TestCase>
  cases: Partial<TestCase>[]
}

export function createTestCase(partialTestCase: Partial<TestCase>): TestCase {
  // Ensure required properties are present
  const requiredProps: (keyof TestCase)[] = ['componentName', 'moduleName', 'feature', 'testDescription'];
  for (const prop of requiredProps) {
    if (typeof partialTestCase[prop] == "undefined") {
      throw new Error(`Property ${prop} is required and cannot be undefined.`);
    }
  }

  // Provide default values for each property
  return {
    source: partialTestCase.source || 'Unknown Filename',
    componentName: partialTestCase.componentName!,
    moduleName: partialTestCase.moduleName!,
    feature: partialTestCase.feature!,
    testDescription: partialTestCase.testDescription!,
    unitTestCoverage: partialTestCase.unitTestCoverage || '0%',
    manualTestingResults: partialTestCase.manualTestingResults || 'Not Tested',
    ableToReplicate: partialTestCase.ableToReplicate ?? false,
    notes: partialTestCase.notes || 'No Notes',
    needsDocumentation: partialTestCase.needsDocumentation ?? false,
    jiraReferences: partialTestCase.jiraReferences || [],
    slackThreads: partialTestCase.slackThreads || []
  };
}
export async function parseTestCasesFromYAMLFiles(
  baseDirectory: string,
  projectName: string
): Promise<TestCase[]> {
  const files = glob.sync(`${baseDirectory}/**/*.yaml`, {
    nodir: true,
    dot: true,

  });

  const testCases: TestCase[] = [];

  files.forEach((filename) => {
    try { 
      // Read the file content.
      const content = fs.readFileSync(filename, "utf-8");

      // Parse the YAML content into a JSON object.
      const parsedData = yaml.parse(content);

      // Validate and handle data issues...

      // Return the parsed test cases.
      const testFile = parsedData as ManualTestFile;

      testFile.cases.forEach((c) => {
        try {
          testCases.push(createTestCase({
            source: path.resolve(filename).replace(baseDirectory,projectName),
            componentName: "Manual",
            ...testFile.meta,
            ...c,
          }));
        }
        catch (err) {
         log.warn(`Failed to parse ${JSON.stringify(c)} from file ${filename}`, err);
        }
       
      });
    }
    catch (err) {
      log.warn(`Failed to parse file:  ${filename}`, err)
    }
  });

  return testCases;
}

export async function parseTestCasesFromComments(
  baseDirectory: string,
  projectName: string
): Promise<TestCase[]> {


  // Get all JavaScript and TypeScript files in the base directory.
  const files = glob.sync(`${baseDirectory}/**/*.{js,ts}`, {
    nodir: true,
  });

  const testCases: TestCase[] = [];

  files.forEach((filename) => {
    // Read the file content.
    const content = fs.readFileSync(filename, "utf-8");

    // Regular expression to find blocks of comments with @Saffron header
    const testCaseRegex = /@Saffron\s*\r?\n(?:\s*\*\s*(.*\r?\n)*)+?\s?\*\//g;

    // Find all matches in the file.
    const matches = content.match(testCaseRegex);

    if (matches) {
      matches.forEach((match) => {
        // Remove comment characters and @Saffron header.
        const yamlChunk = match
          .replace(/@Saffron/, "")
          .replace(/\s*\*\s*/g, "\n")
          .replace(/^\s?\*?\/$/gm, "")
          .trim();

        // Parse the YAML chunk into a JSON object.
        const testCaseData: Partial<TestCase> = yaml.parse(yamlChunk);

        // Add filename to the test case data.
        testCaseData.source = path.resolve(filename).replace(baseDirectory,projectName);

        // Push the test case data to the array.
        testCases.push(createTestCase(testCaseData));
      });
    }
  });

  return testCases
}
