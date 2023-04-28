// Import the necessary libraries
import * as Papa from "https://cdn.jsdelivr.net/npm/papaparse/+esm";
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/+esm";

// Cache DOM elements for later use
const fileInput = document.getElementById("fileInput");
const dataPreview = document.getElementById("dataPreview");
const searchContainer = document.getElementById("searchContainer");

// Listen for file input changes
fileInput.addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
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
    searchContainer.style.display = "block";
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

async function displayTable(data) {
  let table = document.createElement("table");
  table.classList.add("w-full", "text-left", "border-collapse", "table-auto");

  // Add table header
  let thead = document.createElement("thead");
  let headerRow = document.createElement("tr");

  // Use the first row of the uploaded CSV as the header
  const headerData = data[0];
  headerData.forEach((header, columnIndex) => {
    const headerCell = document.createElement("th");
    headerCell.classList.add("border", "p-2", "sticky", "top-0", "bg-white");
    headerCell.textContent = header;

    // Add Train and Label checkboxes for each column
    const trainCheckbox = document.createElement("input");
    trainCheckbox.type = "radio";
    trainCheckbox.className = "train-radio ml-2";
    trainCheckbox.name = `column${columnIndex}`;

    trainCheckbox.dataset.columnIndex = columnIndex;

    const labelRadio = document.createElement("input");
    labelRadio.type = "radio";
    labelRadio.name = `column${columnIndex}`;
    labelRadio.className = "label-radio ml-2";
    labelRadio.dataset.columnIndex = columnIndex;

    headerCell.appendChild(trainCheckbox);
    headerCell.appendChild(document.createTextNode("Train"));
    headerCell.appendChild(labelRadio);
    headerCell.appendChild(document.createTextNode("Label"));

    headerRow.appendChild(headerCell);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Add table body
  let tbody = document.createElement("tbody");
  data.slice(1).forEach((row, rowIndex) => {
    const tableRow = document.createElement("tr");

    row.forEach((cell) => {
      const tableCell = document.createElement("td");
      tableCell.classList.add("border", "p-2");
      tableCell.textContent = cell;
      tableRow.appendChild(tableCell);
    });

    tbody.appendChild(tableRow);
  });
  table.appendChild(tbody);

  // Replace the previous table (if any) with the new one
  dataPreview.innerHTML = "";
  dataPreview.style.overflow = "auto";
  dataPreview.style.height = "400px";
  dataPreview.appendChild(table);

  // Remove the previous preprocess data button if there is one.
  document.getElementById("processData").innerHTML = "";

  // Add "Preprocess Data" button
  const preprocessButton = document.createElement("button");
  preprocessButton.textContent = "Preprocess Data";
  preprocessButton.classList.add(
    "mt-4",
    "bg-blue-500",
    "hover:bg-blue-700",
    "text-white",
    "font-bold",
    "py-2",
    "px-4",
    "rounded"
  );
  document.getElementById("processData").appendChild(preprocessButton);

  preprocessButton.addEventListener("click", async () => {
    const trainCheckboxes = document.querySelectorAll(".train-radio:checked");
    const labelRadio = document.querySelector(".label-radio:checked");

    if (!labelRadio) {
      alert("Please select a column for the label");
      return;
    }
    console.log(trainCheckboxes.length);
    if (trainCheckboxes.length == 0) {
        alert("Please select a column for the train");
        return;
      }
    const { trainTensor, labelTensor } = await preprocessData(
      data,
      trainCheckboxes,
      labelRadio
    );
    // Do something with the preprocessed tensors (e.g., train a model, display the tensors, etc.)
    console.log(trainTensor, labelTensor);
  });

  // Add "Select All" buttons for train and label columns
  const selectAllTrainBtn = document.createElement("button");
  selectAllTrainBtn.textContent = "Select All Train";
  selectAllTrainBtn.classList.add(
    "bg-blue-500",
    "text-white",
    "px-4",
    "py-2",
    "rounded",
    "mr-4"
  );
  selectAllTrainBtn.addEventListener("click", () => {
    const trainRadios = document.querySelectorAll(".train-radio");
    trainRadios.forEach((radio) => {
      radio.checked = true;
    });
  });

  const selectAllLabelBtn = document.createElement("button");
  selectAllLabelBtn.textContent = "Select All Label";
  selectAllLabelBtn.classList.add(
    "bg-blue-500",
    "text-white",
    "px-4",
    "py-2",
    "rounded"
  );
  selectAllLabelBtn.addEventListener("click", () => {
    const labelRadios = document.querySelectorAll(".label-radio");
    labelRadios.forEach((radio) => {
      radio.checked = true;
    });
  });

  const buttonsContainer = document.getElementById("buttonsContainer");
  buttonsContainer.innerHTML = "";
  buttonsContainer.appendChild(selectAllTrainBtn);
  buttonsContainer.appendChild(selectAllLabelBtn);
}

// Search and filter functionality
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", handleSearch);

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  const tableRows = document.querySelectorAll("#dataPreview tbody tr");

  tableRows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    let rowText = "";
    cells.forEach((cell) => {
      rowText += cell.textContent.toLowerCase() + " ";
    });

    if (rowText.includes(searchTerm)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

async function preprocessData(data, trainCheckboxes, labelRadio) {
  const trainColumns = [];
  const labelColumn = parseInt(labelRadio.dataset.columnIndex);

  trainCheckboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      trainColumns.push(parseInt(checkbox.dataset.columnIndex));
    }
  });

  if (trainColumns.length === 0 || isNaN(labelColumn)) {
    console.error("No columns selected for training or label");
    return;
  }

  // Remove the header row and filter the selected columns
  const filteredData = data.slice(1).map((row) => {
    const newRow = [];
    trainColumns.forEach((colIndex) => newRow.push(row[colIndex]));
    newRow.push(row[labelColumn]);
    return newRow;
  });

  // Convert the filtered data into tensors
  const tensorData = tf.tensor2d(filteredData, [
    filteredData.length,
    trainColumns.length + 1,
  ]);
  const trainTensor = tensorData.slice(
    [0, 0],
    [filteredData.length, trainColumns.length]
  );
  const labelTensor = tensorData.slice(
    [0, trainColumns.length],
    [filteredData.length, 1]
  );

  return { trainTensor, labelTensor };
}

document.getElementById('add-layer').addEventListener('click', () => {
    const layerDiv = document.createElement('div');
    layerDiv.classList.add('flex', 'items-center', 'space-x-2', 'layer-row');
  
    const label = document.createElement('span');
    label.textContent = 'Layer:';
  
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 1;
    input.value = 10;
    input.classList.add('py-1', 'px-2', 'border', 'border-gray-300', 'rounded-md', 'w-20');
  
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('bg-red-500', 'hover:bg-red-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded');
  
    deleteButton.addEventListener('click', () => {
      layerDiv.remove();
    });
  
    layerDiv.appendChild(label);
    layerDiv.appendChild(input);
    layerDiv.appendChild(deleteButton);
  
    document.getElementById('layers-container').appendChild(layerDiv);
  });
  
  document.getElementById('train-model').addEventListener('click', async () => {
    // Read the architecture from the form
    const layers = Array.from(document.querySelectorAll('.layer-row input')).map(input => parseInt(input.value));
  
    // Create the model using the specified architecture
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: layers[0], inputShape: [trainTensor.shape[1]], activation: 'relu' }));
    for (let i = 1; i < layers.length; i++) {
      model.add(tf.layers.dense({ units: layers[i], activation: 'relu' }));
    }
    model.add(tf.layers.dense({ units: 1 }));
  
    // Compile the model
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError', metrics: ['accuracy'] });
  
    // Train the model and display the training progress with TensorBoard (replace 'logs' with the desired log directory)
    const logsDir = 'logs';
    const tensorboardCallback = tf.callbacks.tensorBoard(logsDir, { updateFreq: 'batch' });
  
    await model.fit(trainTensor, labelTensor, {
      epochs: 10,
      batchSize: 32,
      callbacks: [tensorboardCallback],
    });
  
    // Do something with the trained model (e.g., make predictions, evaluate the model, etc.)
    console.log('Model trained successfully');
  });
  