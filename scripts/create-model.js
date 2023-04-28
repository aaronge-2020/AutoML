// Import the necessary libraries
import * as Papa from 'https://cdn.jsdelivr.net/npm/papaparse/+esm'
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/+esm";

// Cache DOM elements for later use
const fileInput = document.getElementById("fileInput");
const dataPreview = document.getElementById("dataPreview");

// Listen for file input changes
fileInput.addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
  console.log("file upload");
  const file = event.target.files[0];
  const fileType = file.type;

  // Check if the file is a CSV, TSV, or .xlsx file
  if (
    fileType === "text/csv" ||
    fileType === "application/vnd.ms-excel" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    let fileReader = new FileReader();
    fileReader.onload = function (e) {
      const fileContent = e.target.result;

      // Parse and display the content of the uploaded file
      if (fileType === "text/csv" || fileType === "application/vnd.ms-excel") {
        parseCSV(fileContent);
      } else if (
        fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        parseXLSX(fileContent);
      }
    };
    fileReader.readAsBinaryString(file);
  } else {
    alert("Invalid file type. Please upload a CSV, TSV, or .xlsx file.");
  }
}

function parseCSV(csvData) {
  Papa.default.parse(csvData, {
    complete: function (results) {
      displayTable(results.data);
    },
  });
}

function parseXLSX(xlsxData) {
  const workbook = XLSX.default.read(xlsxData, { type: "binary" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.default.utils.sheet_to_json(worksheet, { header: 1 });
  displayTable(data);
}

function displayTable(data) {
  let table = document.createElement("table");
  table.classList.add("w-full", "text-left", "border-collapse");

  // Add table header
  let thead = document.createElement("thead");
  let headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th class="border p-2">Train</th>
    <th class="border p-2">Label</th>
    <th class="border p-2">Data</th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Add table body
  let tbody = document.createElement("tbody");
  data.forEach((row) => {
    let tableRow = document.createElement("tr");
    tableRow.innerHTML = `
      <td class="border p-2"><input type="checkbox" class="train-checkbox"></td>
      <td class="border p-2"><input type="radio" name="label-radio" class="label-radio"></td>
      <td class="border p-2">${row.join(", ")}</td>
    `;
    tbody.appendChild(tableRow);
  });
  table.appendChild(tbody);

  // Replace the previous table (if any) with the new one
  dataPreview.innerHTML = "";
  dataPreview.appendChild(table);
}
