import { ensureSheetExists, sheets } from ".";

const sharedConfigSheetName = "SaffronShared";

export async function writeToSheet(spreadsheetId: string, data: {[key: string]: any}): Promise<void> {
    await ensureSheetExists(spreadsheetId, sharedConfigSheetName);

    // Read existing values from the sheet
    const range = sharedConfigSheetName + '!A:B';
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const existingValues = response.data.values || [];
    const existingData: {[key: string]: any} = {};

    existingValues.forEach(([key, value]) => {
        existingData[key] = JSON.parse(value);
    });

    // Compare existing and new values and only keep different ones
    const valuesToUpdate = Object.entries(data)
        .filter(([key, value]) => existingData[key] !== value)
        .map(([key, value]) => [key, JSON.stringify(value)]);

    if (valuesToUpdate.length === 0) {
        console.log('No data changes detected.');
        return;
    }

    // Write only the different values back to the sheet
    const updateRange = sharedConfigSheetName + '!A1:B' + valuesToUpdate.length;
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: valuesToUpdate
        },
    });
}

export async function readFromSheet(spreadsheetId: string): Promise<{[key: string]: any}> {
  await ensureSheetExists(spreadsheetId, sharedConfigSheetName);
  
  const range = sharedConfigSheetName + '!A:B';
  const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
  });

  const values = response.data.values || [];
  const data: {[key: string]: any} = {};

  values.forEach(([key, value]) => {
      data[key] = JSON.parse(value);
  });

  return data;
}
