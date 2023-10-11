import path from "path";
import { generateTestCasesSheet, parseTestCases } from "../";
import { google } from "googleapis";

async function run() {
  const testCases = parseTestCases(path.join(__dirname, "cases"));
  console.log(testCases);

  // Initialize Google Auth Client
  const auth = new google.auth.JWT({
    keyFile: path.join(
      __dirname,
      "..",
      ".env",
      "sa.json"
    ),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  
  const {SHEET_ID, SHEET_NAME } = require(path.join(
    __dirname,
    "..",
    ".env",
    "sheet.json"
  ))

  // Generate the Google Sheet
  await generateTestCasesSheet(testCases, {
    spreadsheetId: SHEET_ID,
    sheetName: SHEET_NAME,
    auth: auth,
  });
}

run();
