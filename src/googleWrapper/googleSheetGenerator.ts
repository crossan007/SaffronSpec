import { google } from "googleapis";
import { ensureSheetExists, sheets } from ".";
import { TestCase } from "../testCaserParser"; // Import your TestCase interface

export interface SheetGeneratorOptions {
  spreadsheetId: string;
  sheetName: string;
}

export async function generateTestCasesSheet(
  testCases: TestCase[],
  options: SheetGeneratorOptions
): Promise<void> {

  const sheetDetails = await ensureSheetExists(options.spreadsheetId, options.sheetName)
  await setColumnWidths(options.spreadsheetId, sheetDetails.sheetId)
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



async function setColumnWidths(
  spreadsheetId: string,
  sheetId: number, // You get this ID from sheet propertie
): Promise<void> {

  const startIndex = 0;
  const endIndex = 10;
  const pixelSize = 200;

  // Construct and send a batchUpdate request to set column width
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'COLUMNS',
              startIndex,
              endIndex
            },
            properties: {
              pixelSize
            },
            fields: 'pixelSize'
          }
        }
      ]
    }
  });

  console.log(`Width of columns ${startIndex} to ${endIndex} set to ${pixelSize} pixels.`);
}
