import { JWT } from "google-auth-library";
import { google, sheets_v4 } from "googleapis";

export let sheets: sheets_v4.Sheets;

export async function setAuth(newAuth: any) {
  sheets = google.sheets({ version: 'v4', auth: newAuth });
}


export * from "./googleSheetGenerator"
export * from "./googleSheetStorage"


interface Sheet {
  title: string
  sheetId: number
}

export async function ensureSheetExists(
  spreadsheetId: string,
  sheetTitle: string
): Promise<Sheet> {


  // Fetch existing sheets in the Spreadsheet
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  });

  const ourSheet = data.sheets?.find((sheet) => sheet.properties?.title == sheetTitle);

  // Check if sheetTitle exists
  if (!ourSheet) {
    // If not, add a new sheet with the title
    const result = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle,
              },
            },
          },
        ],
      },
    });
    console.log(`Sheet "${sheetTitle}" created.`);
    const replise = (result.data.replies || []) 
    return replise[0].addSheet?.properties as unknown as Sheet
  } else {
    return ourSheet.properties as Sheet
    console.log(`Sheet "${sheetTitle}" already exists.`);
  }
}