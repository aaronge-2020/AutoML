import { parseCSV, parseTSV } from "./preprocessing.js";

let testedModel = null;
let testedData = null;
let classLabels = null;

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
            const classNames = JSON.parse(localStorage.getItem("class_names"))[sessionStorage.getItem("selectedModelName")];
            
            const predictions = testedModel.predict(testedData);
            const formattedPredictions = predictions.arraySync()[0]
    
            // Display the results in the inferenceResults element
            // Loop through the classNames and add the class name to the formattedPredictions
            for (let i = 0; i < classNames.length; i++) {
                formattedPredictions[i] = classNames[i] + ": " + formattedPredictions[i] + "\n";
            }
    
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