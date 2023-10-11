import * as fs from "fs";
import * as glob from "glob";
import { getLogger } from "loglevel";
import path from "path";
import * as yaml from "yaml";

const log = getLogger("Parser");

export interface TestCase {
  source: string;
  componentName: string;
  functionalArea: string;
  feature: string;
  testDescription: string;
  unitTestCoverage: string;
  initialResults: string;
  ableToReplicate: string;
  notes: string;
  needsDocumentation: string;
  jiraReferences: string[];
  slackThreads: string[];
}

interface ManualTestFile {
  meta: Partial<TestCase>
  cases: Partial<TestCase>[]
}

export function createTestCase(partialTestCase: Partial<TestCase>): TestCase {
  // Ensure required properties are present
  const requiredProps: (keyof TestCase)[] = ['componentName', 'functionalArea', 'feature', 'testDescription'];
  for (const prop of requiredProps) {
    if (typeof partialTestCase[prop] == "undefined") {
      throw new Error(`Property ${prop} is required and cannot be undefined.`);
    }
  }

  // Provide default values for each property
  return {
    source: partialTestCase.source || 'Unknown Filename',
    componentName: partialTestCase.componentName!,
    functionalArea: partialTestCase.functionalArea!,
    feature: partialTestCase.feature!,
    testDescription: partialTestCase.testDescription!,
    unitTestCoverage: partialTestCase.unitTestCoverage || '',
    initialResults: partialTestCase.initialResults || 'Not Tested',
    ableToReplicate: partialTestCase.ableToReplicate ?? '',
    notes: partialTestCase.notes || '',
    needsDocumentation: partialTestCase.needsDocumentation ?? '',
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

    let match;
    while ((match = testCaseRegex.exec(content)) !== null) {
      // Remove comment characters and @Saffron header.
      const yamlChunk = match[0]
        .replace(/@Saffron/, "")
        .replace(/\s*\*\s*/g, "\n")
        .replace(/^\s?\*?\/$/gm, "")
        .trim();

      // Parse the YAML chunk into a JSON object.
      const testCaseData: Partial<TestCase> = yaml.parse(yamlChunk);

      const lineNumber = (content.substring(0, match.index).match(/\r?\n/g) || []).length + 1;

      // Add filename and offset to the test case data.
      testCaseData.source = path.resolve(filename).replace(baseDirectory, projectName)+ "@" + lineNumber;


       // Push the test case data to the array.
      testCases.push(createTestCase({
        componentName: projectName,
        ...testCaseData
      }));
    }
  });

  return testCases
}
