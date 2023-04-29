import * as Papa from "https://cdn.jsdelivr.net/npm/papaparse/+esm";
import { parseCSV, parseXLSX, parseTSV } from "./preprocessing.js";

let testedModel = null;
let testedData = null;

async function showAccuracyAndConfusionMatrix(model, data, classNames) {
    const [preds, labels] = tf.tidy(() => {
        const preds = model.predict(data.xs);
        const labels = data.ys.argMax([-1]);
        return [preds.argMax([-1]), labels];
    });

    const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds);
    const container = { name: 'Accuracy', tab: 'Evaluation' };
    tfvis.show.perClassAccuracy(container, classAccuracy, classNames);

    const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds);
    const container2 = { name: 'Confusion Matrix', tab: 'Evaluation' };
    tfvis.render.confusionMatrix(container2, { values: confusionMatrix }, classNames);

    labels.dispose();
}

// // Retrieve the selected model name from sessionStorage
// const selectedModelName = sessionStorage.getItem("selectedModelName");

// // Display the selected model name on the page
// const modelInfoDiv = document.getElementById("model-info");
// modelInfoDiv.textContent = `Testing model: ${selectedModelName}`;

// // Load the model for testing
// async function loadModel() {
// const model = await tf.loadLayersModel(`localstorage://${selectedModelName}`);
// // Perform testing with the loaded model here

// }


// // Call the loadModel function to load the model for testing
// loadModel();

document.addEventListener("DOMContentLoaded", async function () {
    const uploadJSONInput = document.getElementById('model-json');
    const uploadWeightsInput = document.getElementById('model-weights');
    const uploadModelBtn = document.getElementById("upload-model");
    const modelUploadStatus = document.getElementById("model-upload-status");

    const dataUpload = document.getElementById("data-upload");
    const uploadDataBtn = document.getElementById("upload-data");
    const dataUploadStatus = document.getElementById("data-upload-status");

    const runInferenceBtn = document.getElementById("run-inference");
    const inferenceResults = document.getElementById("inference-results");


    // If sessionStorage contains a selected model name, change the modelUploadStatus element to display the name and a success message
    let selectedModelName = sessionStorage.getItem("selectedModelName");
    if (selectedModelName) {
        modelUploadStatus.textContent = `Model ${selectedModelName} loaded successfully!`;

        // Load the model for testing
        const model = await tf.loadLayersModel(`localstorage://${selectedModelName}`);
        testedModel = model;
    }

    uploadModelBtn.addEventListener("click", async function () {
        if (!uploadJSONInput.files.length || !uploadWeightsInput.files.length) {
            alert("Please upload both model files.");
            return;
        }

        try {
            const model = await tf.loadLayersModel(tf.io.browserFiles([uploadJSONInput.files[0], uploadWeightsInput.files[0]]));
            testedModel = model;

            modelUploadStatus.textContent = "Model uploaded successfully!";
        } catch (error) {
            modelUploadStatus.textContent = "Failed to upload model.";
            alert("Error uploading the model: " + error.message);
        }
    });

    uploadDataBtn.addEventListener("click", async function () {
        if (!dataUpload.files.length) {
            alert("Please select a data file to upload.");
            return;
        }

        try {
            dataUploadStatus.textContent = "Uploading data...";
            const reader = new FileReader();

            reader.onload = function (event) {
                let fileContent = event.target.result;
                // Parse the contents of the file based on its format:
                const file = dataUpload.files[0];
                if (file.name.endsWith('.csv')) {
                    const csvData = parseCSV(fileContent);

                    testedData = tf.tensor2d(csvData.data.map((x) => {
                        return x.map((y) => {
                            return Number(y);
                        });

                    }));

                } else if (file.name.endsWith('.tsv')) {
                    const csvData = parseTSV(fileContent);

                    testedData = tf.tensor2d(csvData.data.map((x) => {
                        return x.map((y) => {
                            return Number(y);
                        });

                    }));
                } else {
                    throw new Error('Unsupported file type');
                }
                dataUploadStatus.textContent = "Data uploaded successfully!";
            };
            reader.onerror = function () {
                dataUploadStatus.textContent = "Failed to upload data.";
                alert("Error uploading the data file.");
            };
            reader.readAsText(dataUpload.files[0]);
        } catch (error) {
            dataUploadStatus.textContent = "Failed to upload data.";
            alert("Error uploading the data: " + error.message);
        }
    });


    runInferenceBtn.addEventListener("click", async function () {
        if (!testedModel) {
            alert("Please upload a model.");
            return;
        }
    
        if (!testedData) {
            alert("Please upload data.");
            return;
        }
    
        try {
            const predictions = testedModel.predict(testedData);
            const formattedPredictions = JSON.stringify(predictions.arraySync(), null, 2);
    
            // Display the results in the inferenceResults element
            inferenceResults.innerHTML = '<pre>Inference results:\n' + formattedPredictions + '</pre>';
    
            // Create a copy button with clipboard icon
            const copyButton = document.createElement("button");
            copyButton.innerHTML = '<i class="fas fa-clipboard"></i>';
            copyButton.style.position = "absolute";
            copyButton.style.top = "0";
            copyButton.style.right = "0";
            copyButton.classList.add("copyButton"); // Add the copyButton class
    
            // Copy the formattedPredictions to the clipboard
            copyButton.addEventListener("click", function () {
                navigator.clipboard.writeText(formattedPredictions).then(function () {
                    alert("Copied JSON to clipboard!");
                }, function (err) {
                    alert("Error copying JSON to clipboard: " + err.message);
                });
            });
    
            // Append the copy button to the inferenceResults element
            inferenceResults.appendChild(copyButton);
        } catch (error) {
            alert("Error running model inference: " + error.message);
        }
    });
    
    
});