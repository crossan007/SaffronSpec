# SaffronSpec

### A Symphony of Testing Methods

SaffronSpec intertwines the precision of automated unit testing with the detailed insight of manual test cases, creating a comprehensive and thorough testing environment. By marrying the technical accuracy of automated tests and the user-centric focus of manual evaluations, it ensures your software is both functionally solid and delivers a stellar user experience. In essence, SaffronSpec doesn’t just test; it weaves a rich tapestry of technical and experiential testing, ensuring your software is a beacon of functionality and user satisfaction.

## Usage

### Installation
To begin using SaffronSpec in your project, install it via npm:
```
npm install saffronspec
```

## Basic Setup


Configure: Create a `.saffron` folder in the base path of your project with the following files:
### Service Account - `sa.json`
 A Google Cloud Project Service account: Create a project in the [Google Cloud Console](https://console.cloud.google.com/), enable the Google Sheets API, create credentials (Service Account), and download the JSON key file.

### Saffron Configuration - `.saffronrc`

```json
{
  "SHEET_ID": "Google Sheet ID",
  "SHEET_NAME": "Sheet1"
}
```

The Google Sheet ID can be obtained from the Google Sheets URL when the document is open in a browser:
 `https://docs.google.com/spreadsheets/d/{{ SHEET_ID }}/edit#gid=0`


## Annotate
Within your code, annotate test cases utilizing the `@Saffron` tag within multiline comments, followed by the respective test case data formatted in YAML.

Example:

```javascript

/**
 * @Saffron
 * componentName: ExampleComponent
 * moduleName: ExampleModule
 * ...
 */
```

## Generate
Employ the SaffronSpec CLI to parse your annotated test cases and update your Google Sheet.

```sh

npx saffron run /path/to/your/project
```

## Detailed Documentation

For a thorough guide and detailed usage instructions, refer to the official SaffronSpec documentation.