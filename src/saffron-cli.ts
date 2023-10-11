#!/usr/bin/env ts-node --transpile-only

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateTestCasesSheet, parseTestCases, SheetGeneratorOptions, TestCase } from './';
import fs from 'fs';
import path from 'path';
import { google } from "googleapis";

yargs(hideBin(process.argv))
  .command(
    'run [basePath]',
    'Parses Test cases from the target path and writes a Google Sheet',
    (yargs) => {
      return yargs
        .positional('basePath', {
          describe: 'Base path where .saffron configuration folder is located',
          type: 'string',
          default: process.cwd()  // Defaults to current working directory
        });
    },
    async (argv) => {
      try {
        const saffronConfigPath = path.join(argv.basePath, ".saffron",'.saffronrc');
        if (!fs.existsSync(saffronConfigPath)) {
          throw new Error('.saffronrc not found in the specified basePath');
        }

        const saffronConfig = JSON.parse(fs.readFileSync(saffronConfigPath, 'utf8'));

        const testCases = parseTestCases(argv.basePath);
        console.log(testCases);
        
        // Use the .saffronrc config for auth and spreadsheetId
        const options: SheetGeneratorOptions = {
          auth:  new google.auth.JWT({
            keyFile: path.join(argv.basePath, ".saffron","sa.json"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          }),
          spreadsheetId: saffronConfig.SHEET_ID,
          sheetName: saffronConfig.SHEET_NAME
        };

        await generateTestCasesSheet(testCases, options);
        console.log('Sheet generated successfully!');
      } catch (error) {
        console.error('Error generating sheet:', error);
      }
    }
  )
  .help()
  .alias('help', 'h')
  .argv;
