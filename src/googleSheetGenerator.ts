import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { TestCase } from "./testCaserParser"; // Import your TestCase interface

export interface SheetGeneratorOptions {
  spreadsheetId: string;
  sheetName: string;
  auth: JWT;
}


export async function generateTestCasesSheet(
  testCases: TestCase[],
  options: SheetGeneratorOptions
): Promise<void> {
  // Extract headers from the TestCase interface
  const headers = Object.keys(testCases[0]);

  // Prepare the data for the sheet
  const values = testCases.map((testCase) =>
    headers.map((header) => {
      const caseProperty = testCase[header as keyof TestCase]
      if (Array.isArray(caseProperty)){ 
        return caseProperty.join(";")
      }
      return caseProperty
    })
  );

  // Insert headers as the first row
  values.unshift(headers);

  const sheets = google.sheets({ version: "v4", auth: options.auth });


  await sheets.spreadsheets.values.update({ 
    spreadsheetId: options.spreadsheetId,
    range: `${options.sheetName}!A1:Z1000`,
    valueInputOption: "RAW",
    requestBody: {
      majorDimension: "ROWS",
      values: values
    }
  });

}
