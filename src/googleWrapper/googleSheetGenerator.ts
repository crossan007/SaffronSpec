import { ensureSheetExists, sheets } from ".";
import { TestCase } from "../testCaserParser"; // Import your TestCase interface
import { capitalCase } from "change-case-all";
export interface SheetGeneratorOptions {
  spreadsheetId: string;
  sheetName: string;
}

export async function generateTestCasesSheet(
  testCases: TestCase[],
  options: SheetGeneratorOptions
): Promise<void> {
  const sheetDetails = await ensureSheetExists(
    options.spreadsheetId,
    options.sheetName
  );
 
  // Extract headers from the TestCase interface
  const headers = Object.keys(testCases[0]);

  await formatTestSheet(options.spreadsheetId, sheetDetails.sheetId, headers.length);

  // Prepare the data for the sheet
  const values = testCases.map((testCase) =>
    headers.map((header) => {
      const propertyValue = testCase[header as keyof TestCase];
      if (Array.isArray(propertyValue)) {
        return propertyValue.join(";");
      }
      return propertyValue;
    })
  );

  // Insert headers as the first row
  values.unshift(headers.map((h) => capitalCase(h)));
  await sheets.spreadsheets.values.update({
    spreadsheetId: options.spreadsheetId,
    range: `${options.sheetName}!A1:Z1000`,
    valueInputOption: "RAW",
    requestBody: {
      majorDimension: "ROWS",
      values: values,
    },
  });
}

async function formatTestSheet(
  spreadsheetId: string,
  sheetId: number,
  headerColumns: number
): Promise<void> {
  // Construct and send a batchUpdate request to set column width
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: 0,
              endIndex: 1,
            },
            properties: {
              hiddenByUser: true,
            },
            fields: "hiddenByUser",
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: 1,
              endIndex: headerColumns,
            },
            properties: {
              pixelSize: 200,
            },
            fields: "pixelSize",
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: 4,
              endIndex: 5,
            },
            properties: {
              pixelSize: 300,
            },
            fields: "pixelSize",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId, // Replace this with the sheetId if you have it
              startRowIndex: 0,
              endRowIndex: 100, // Replace with the number of rows you want to set the format
              startColumnIndex: 0,
              endColumnIndex: 100, // Replace with the number of columns you want to set the format
            },
            cell: {
              userEnteredFormat: {
                wrapStrategy: "WRAP", // Other possible values are "OVERFLOW_CELL" and "CLIP"
              },
            },
            fields: "userEnteredFormat.wrapStrategy",
          },
        },
        {
          setBasicFilter: {
            filter: {
              range: {
                sheetId,
                startRowIndex: 0
              },
              sortSpecs: [
                {
                  dimensionIndex: 0,
                  sortOrder: "ASCENDING"
                }
              ]
            },
          },
        },
        {
          "setDataValidation": {
            "range": {
              sheetId,
              "startRowIndex": 1,
              "endRowIndex": 1000, 
              "startColumnIndex": 6,
              "endColumnIndex": 7
            },
            "rule": {
              "condition": {
                "type": "ONE_OF_LIST",
                "values": [
                  { "userEnteredValue": "Todo" },
                  { "userEnteredValue": "Skipped" },
                  { "userEnteredValue": "Pass" },
                  { "userEnteredValue": "Fail - Blocker" },
                  { "userEnteredValue": "Fail - Non Blocker" },
                  { "userEnteredValue": "Change Request" }
                ]
              },
              "inputMessage": "Choose an option from the dropdown.",
              "strict": true,
              "showCustomUi": true 
            }
          }
        }
      ],
    },
  });
}
