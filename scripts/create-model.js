// Import the necessary libraries
import * as Papa from "https://cdn.jsdelivr.net/npm/papaparse/+esm";
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx/+esm";
import * as tfvis from "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-vis/+esm";

// const backend = 'webgl'; // 'cpu' or 'wasm'
//     const context = await navigator.ml.createContext();
//     const tf = context.tf;
//     await tf.setBackend(backend);
//     await tf.ready();

// Cache DOM elements for later use
const fileInput = document.getElementById("fileInput");
const dataPreview = document.getElementById("dataPreview");
const searchContainer = document.getElementById("searchContainer");
const visorToggleButton = document.getElementById("visor-toggle-button");

// Listen for file input changes
fileInput.addEventListener("change", handleFileUpload);

let trainData = null;
let labelData = null;

function handleFileUpload(event) {
  trainData = null;
  labelData = null;
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

    const trainLabel = document.createElement("div");
    trainLabel.classList.add("inline-block");
    trainLabel.appendChild(trainCheckbox);
    trainLabel.appendChild(document.createTextNode("Train"));

    const labelRadio = document.createElement("input");
    labelRadio.type = "radio";
    labelRadio.name = `column${columnIndex}`;
    labelRadio.className = "label-radio ml-2";
    labelRadio.dataset.columnIndex = columnIndex;

    const labelLabel = document.createElement("div");
    labelLabel.classList.add("inline-block");
    labelLabel.appendChild(labelRadio);
    labelLabel.appendChild(document.createTextNode("Label"));

    // Create another radio button for that allows the user to choose to ignore the column
    const ignoreRadio = document.createElement("input");
    ignoreRadio.type = "radio";
    ignoreRadio.name = `column${columnIndex}`;
    ignoreRadio.className = "ignore-radio ml-2";
    ignoreRadio.dataset.columnIndex = columnIndex;

    // Create the label for the ignore radio button
    const ignoreLabel = document.createElement("div");
    ignoreLabel.classList.add("inline-block");
    ignoreLabel.appendChild(ignoreRadio);
    ignoreLabel.appendChild(document.createTextNode("Ignore"));

    const radioContainer = document.createElement("div");
    radioContainer.classList.add("ml-2");
    radioContainer.appendChild(trainLabel);
    radioContainer.appendChild(labelLabel);
    radioContainer.appendChild(ignoreLabel);
    // Adjust the width of the header cell to display radio buttons in a single row
    radioContainer.style.width = "200px";
    radioContainer.style.marginLeft = "0px";

    headerCell.appendChild(radioContainer);

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

    trainData = trainTensor;
    labelData = labelTensor;
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

// async function preprocessData(data, trainCheckboxes, labelRadio) {
//   const trainColumns = [];
//   const labelColumn = parseInt(labelRadio.dataset.columnIndex);

//   trainCheckboxes.forEach((checkbox) => {
//     if (checkbox.checked) {
//       trainColumns.push(parseInt(checkbox.dataset.columnIndex));
//     }
//   });

//   if (trainColumns.length === 0 || isNaN(labelColumn)) {
//     console.error("No columns selected for training or label");
//     return;
//   }

//   // Remove the header row and filter the selected columns
//   const filteredData = data.slice(1).map((row) => {
//     const newRow = [];
//     trainColumns.forEach((colIndex) => newRow.push(parseFloat(row[colIndex])));

//     newRow.push(row[labelColumn].trim());
//     return newRow;
//   });

//   // Convert the filtered data into tensors
//   const featuresArray = filteredData.map((row) => row.slice(0, -1));
//   const labelsArray = filteredData.map((row) => row.slice(-1)[0]);

//   const featureTensor = tf.tensor2d(featuresArray);
//   const labelTensor = tf.tensor1d(labelsArray, "string");

//   // One-hot encode the labels
//   const uniqueLabels = Array.from(new Set(labelTensor.dataSync()));
//   const labelMap = new Map(uniqueLabels.map((label, index) => [label, index]));
//   const labelArray = labelsArray.map((label) => labelMap.get(label));
//   const encodedLabelTensor = tf.tensor1d(labelArray, "int32");

//   let oneHotLabelTensor;
//   if (uniqueLabels.length < 2) {
//     console.error(
//       "Error: At least two unique labels are required for one-hot encoding."
//     );
//     return;
//   } else {
//     oneHotLabelTensor = tf.oneHot(encodedLabelTensor, uniqueLabels.length);
//   }
//   alertify.success('Dataset Preprocessed Successfully! :D');
//   return { trainTensor: featureTensor, labelTensor: oneHotLabelTensor };
// }
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

  data = data.filter((row) => {
    return row.every((value) => value !='');
  });

  // Remove the header row and filter the selected columns
  const filteredData = data.slice(1).map((row) => {
    const newRow = [];

    trainColumns.forEach((colIndex) => {
      const cell = row[colIndex];
      const parsedValue = parseFloat(cell);

      const columnValues = data
        .slice(1)
        .map((row) => row[colIndex]);
      const allNumeric = columnValues.every((value) => !isNaN(value));

      if (!allNumeric) {
        const uniqueValues = Array.from(
          new Set(data.slice(1).map((r) => r[colIndex]))
        );
        const valueIndex = uniqueValues.indexOf(cell);
        const oneHotVector = Array.from(
          { length: uniqueValues.length },
          (_, i) => (i === valueIndex ? 1 : 0)
        );
        newRow.push(...oneHotVector);
      } else {
        newRow.push(parsedValue);
      }
    });

    newRow.push(row[labelColumn].trim());
    return newRow;

  });

  // Convert the filtered data into tensors
  const featuresArray = filteredData.map((row) => row.slice(0, -1));
  const labelsArray = filteredData.map((row) => row.slice(-1)[0]);

  const featureTensor = tf.tensor2d(featuresArray);
  const labelTensor = tf.tensor1d(labelsArray, "string");

  // One-hot encode the labels
  const uniqueLabels = Array.from(new Set(labelTensor.dataSync()));
  const labelMap = new Map(uniqueLabels.map((label, index) => [label, index]));
  const labelArray = labelsArray.map((label) => labelMap.get(label));
  const encodedLabelTensor = tf.tensor1d(labelArray, "int32");

  let oneHotLabelTensor;
  if (uniqueLabels.length < 2) {
    console.error(
      "Error: At least two unique labels are required for one-hot encoding."
    );
    return;
  } else {
    oneHotLabelTensor = tf.oneHot(encodedLabelTensor, uniqueLabels.length);
  }
  alertify.success("Dataset Preprocessed Successfully! :D");
  return { trainTensor: featureTensor, labelTensor: oneHotLabelTensor };
}

document.getElementById("add-layer").addEventListener("click", () => {
  const layerDiv = document.createElement("div");
  layerDiv.classList.add("flex", "items-center", "space-x-2", "layer-row");

  const label = document.createElement("span");
  label.textContent = "Layer:";

  const input = document.createElement("input");
  input.type = "number";
  input.min = 1;
  input.value = 10;
  input.classList.add(
    "py-1",
    "px-2",
    "border",
    "border-gray-300",
    "rounded-md",
    "w-20"
  );

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.classList.add(
    "bg-red-500",
    "hover:bg-red-700",
    "text-white",
    "font-bold",
    "py-1",
    "px-2",
    "rounded"
  );

  deleteButton.addEventListener("click", () => {
    layerDiv.remove();
  });

  layerDiv.appendChild(label);
  layerDiv.appendChild(input);
  layerDiv.appendChild(deleteButton);

  document.getElementById("layers-container").appendChild(layerDiv);
});

document.getElementById("train-model").addEventListener("click", async () => {
  // check if data is loaded
  if (trainData == null || labelData == null) {
    alert("Please load and preprocess data first");
    return;
  }

  // Check if the number of layers is at least 1
  if (document.querySelectorAll(".layer-row").length < 1) {
    alert("Please add at least one layer to the model");
    return;
  }

  // Read the hyperparameters from the form
  const learningRate = parseFloat(
    document.getElementById("learning-rate").value
  );
  const batchSize = parseInt(document.getElementById("batch-size").value);
  const epochs = parseInt(document.getElementById("epochs").value);
  const activationFunction = document.getElementById(
    "activation-function"
  ).value;

  // Read the architecture from the form and create the model using the specified architecture
  const layers = Array.from(document.querySelectorAll(".layer-row input")).map(
    (input) => parseInt(input.value)
  );
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      units: layers[0],
      inputShape: [trainData.shape[1]],
      activation: activationFunction,
    })
  );

  for (let i = 1; i < layers.length; i++) {
    model.add(
      tf.layers.dense({ units: layers[i], activation: activationFunction })
    );
  }
  model.add(
    tf.layers.dense({
      units: labelData.arraySync()[0].length,
      activation: "softmax",
    })
  );

  // Compile the model
  const optimizer = tf.train.adam(learningRate);
  model.compile({
    optimizer: optimizer,
    loss: "meanSquaredError",
    metrics: ["accuracy"],
  });

  // Create a surface for loss and accuracy
  const surface = tfvis.visor().surface({
    name: "Loss and Accuracy",
    tab: "Training",
  });

  // Initialize the metrics callbacks
  const metrics = ["loss", "accuracy"];
  const container = {
    name: "Model Training",
    styles: { height: "1000px" },
  };
  const callbacks = tfvis.default.show.fitCallbacks(
    surface,
    metrics,
    container
  );

  searchContainer.style.display = "block";

  // Fit the model
  await model.fit(trainData, labelData, {
    epochs: epochs,
    batchSize: batchSize,
    callbacks: callbacks,
  });

  // Save the trained model to local storage
  const modelName =
    document.getElementById("fileInput").files[0].name.split(".")[0] + "_model"; // Choose a unique name for the model
  await model.save(`localstorage://${modelName}`);

  if (localStorage.getItem("model_epochs") === null) {
    // Create a new dictionary if it doesn't exist
    localStorage.setItem("model_epochs", JSON.stringify({}));
  }
  updateModelEpochs(modelName, epochs);

  // Do something with the trained model
  alertify.success("Model Trained and Saved Successfully! :D");
});

// Add the number of epochs trained by your model to the dictionary
function updateModelEpochs(modelName, epochs) {
  let modelEpochs = JSON.parse(localStorage.getItem("model_epochs"));
  modelEpochs[modelName] = epochs;
  localStorage.setItem("model_epochs", JSON.stringify(modelEpochs));
}

visorToggleButton.addEventListener("click", () => {
  if (tfvis.visor().isOpen()) {
    tfvis.visor().close();
    visorToggleButton.textContent = "Toggle Visor";
  } else {
    tfvis.visor().open();
    visorToggleButton.textContent = "Toggle Visor";
  }
});
