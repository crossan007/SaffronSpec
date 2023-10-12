#!/usr/bin/env ts-node --transpile-only

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createTestCase, generateTestCasesSheet, parseTestCasesFromComments, parseTestCasesFromYAMLFiles, SheetGeneratorOptions, TestCase } from './';
import fs from 'fs';
import path from 'path';
import { google } from "googleapis";
import { getLogger } from 'loglevel';
import { readFromSheet, setAuth, writeToSheet } from './googleWrapper';
const log = getLogger("saffron")
log.enableAll();

export interface SaffronConfig {
  SHEET_ID: string
  SHEET_NAME: string
  RelatedProjects: string[]
}

async function MergeDiscoveries(p: Promise<TestCase[]>[]): Promise<TestCase[]> {
  const allTestCasesArrays = await Promise.all(p);
  const mergedTestCases = ([] as TestCase[]).concat(...allTestCasesArrays);
  return mergedTestCases;
}

const { execSync } = require('child_process');

function getGitHead(folderPath: string) {
    try {
        // Execute git rev-parse command and return the result as a String.
        return execSync('git rev-parse HEAD', {
            cwd: folderPath, // set the working directory
            encoding: 'utf-8' // encode output as a String
        }).trim(); // trim to clean up any leading/trailing whitespace
    } catch (error) {
        console.error('Error getting git HEAD:', error);
        return null;
    }
}



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
        const saffronPath =  path.join(argv.basePath, ".saffron");
        const saffronConfigPath = path.join(saffronPath,'.saffronrc');
        if (!fs.existsSync(saffronConfigPath)) {
          throw new Error('.saffronrc not found in the specified basePath');
        }

        const packageJSONPath = path.join(argv.basePath, "package.json");
        if (!fs.existsSync(packageJSONPath)) {
          throw new Error("package.json not found in the specified basePath");
        }
        const packageHead = getGitHead(argv.basePath).substring(0,8)
        const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, "utf8"));
        const saffronConfig = JSON.parse(fs.readFileSync(saffronConfigPath, 'utf8')) as SaffronConfig;
        const allProjects = [
          ...(saffronConfig.RelatedProjects),
          `${packageJSON.name}@${packageJSON.version}`
        ].sort()

        setAuth(new google.auth.JWT({
          keyFile: path.join(argv.basePath, ".saffron","sa.json"),
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        }));


        const sharedConfig = await readFromSheet(saffronConfig.SHEET_ID);
        log.info("Shared Config keys", Object.keys(sharedConfig));

        const discoveredCases = await MergeDiscoveries([
          parseTestCasesFromComments(path.join(argv.basePath,"src"), packageJSON.name),
          parseTestCasesFromComments(path.join(argv.basePath,"test"), packageJSON.name),
          parseTestCasesFromYAMLFiles(saffronPath, packageJSON.name)
        ])

        await writeToSheet(saffronConfig.SHEET_ID,{
          ...sharedConfig,
          [`${packageJSON.name}@${packageJSON.version}`]:discoveredCases
        })

        
        
        log.info(`Found ${discoveredCases.length} test cases`);

      
        let allTestCases = [
          ...discoveredCases
        ]
        for (let related of saffronConfig.RelatedProjects) {
          if (related in sharedConfig) {
            const relatedCases = (sharedConfig[related] as Partial<TestCase>[]).map((tc)=>createTestCase(tc))
            allTestCases = discoveredCases.concat(relatedCases);
          }
        }

        allTestCases.sort((a,b)=>a.source.localeCompare(b.source))

        
        // Use the .saffronrc config for auth and spreadsheetId
        const options: SheetGeneratorOptions = {
          spreadsheetId: saffronConfig.SHEET_ID,
          sheetName: allProjects.join(",")
        };

        await generateTestCasesSheet(allTestCases, options);
        log.info('Sheet generated successfully!');
      } catch (error) {
        log.error('Error generating sheet:', error);
      }
    }
  )
  .help()
  .alias('help', 'h')
  .argv;
