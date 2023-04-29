
import * as Papa from "https://cdn.jsdelivr.net/npm/papaparse/+esm";
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/+esm";

export function parseCSV(csvData) {
    return Papa.default.parse(csvData);
  }

  export async function parseTSV(tsvData) {
    return Papa.default.parse(tsvData, {
      delimiter: "\t"
    });
  }
  
  export function parseXLSX(xlsxData) {
    const workbook = XLSX.default.read(xlsxData, { type: "binary" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.default.utils.sheet_to_json(worksheet, { header: 1 });
    return data;
  }