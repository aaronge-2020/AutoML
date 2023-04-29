// Get the grid element where models will be displayed
const modelGrid = document.querySelector(".grid");

// Function to create a model card
function createModelCard(modelName, modelType, lastTrained, modelTopology) {
  const modelCard = document.createElement("div");
  modelCard.classList.add("bg-white", "p-4", "rounded", "shadow");

  const modelTitle = document.createElement("h2");
  modelTitle.classList.add("text-xl", "font-bold", "mb-2");
  modelTitle.textContent = modelName;

  const modelDesc = document.createElement("p");
  modelDesc.innerHTML = "<b>Model Type:</b> " + modelType;

  const modelTop = document.createElement("div");
  modelTop.innerHTML = "<b>Model Topology:</b>";

  const layersList = document.createElement("ol");
  const layers = modelTopology.split(", ");
  layers.forEach((layer, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = layer;
    listItem.classList.add("mb-2");
    listItem.style.listStyleType = "decimal";
    listItem.style.marginLeft = "1.5rem";
    listItem.style.paddingLeft = "0.5rem";
    listItem.style.textIndent = "-0.5rem";
    layersList.appendChild(listItem);
  });
  modelTop.appendChild(layersList);

  const lastTrainedText = document.createElement("p");
  lastTrainedText.innerHTML = `<b>Last trained:</b> ${lastTrained}`;

  const loadModelButton = document.createElement("button");
  loadModelButton.classList.add(
    "bg-blue-500",
    "text-white",
    "rounded",
    "py-2",
    "px-4",
    "hover:bg-blue-600"
  );
  loadModelButton.textContent = "Test Model";
  loadModelButton.addEventListener("click", () => {
    // Store the selected model name in sessionStorage
    sessionStorage.setItem("selectedModelName", modelName);
    // Redirect to the test-model.html page
    window.location.href = "test-model.html";
  });

  const saveModelButton = document.createElement("button");
  saveModelButton.classList.add(
    "bg-gray-300",
    "hover:bg-gray-400",
    "text-gray-800",
    "font-bold",
    "py-2",
    "px-4",
    "rounded",
    "inline-flex",
    "items-center",
  );
  saveModelButton.innerHTML = `<svg class="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
  <span>Download</span>`;

  saveModelButton.addEventListener("click", () => {
    // Add code here to load and test the model in another page
    downloadModel(`localstorage://${modelName}`);
  });

  async function downloadModel(localStorageKey) {
    const model = await tf.loadLayersModel(localStorageKey);
    await model.save(`downloads://${localStorageKey.split("//")[1]}`);
  }

  modelCard.appendChild(modelTitle);
  modelCard.appendChild(modelDesc);
  modelCard.appendChild(modelTop);
  modelCard.appendChild(lastTrainedText);

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("flex", "flex-row", "justify-between", "mt-4");
  buttonContainer.appendChild(loadModelButton);
  buttonContainer.appendChild(saveModelButton);

  modelCard.appendChild(buttonContainer);

  return modelCard;
}

// Load models from local storage
function loadModels() {
  // Fetch all the keys from local storage
  const keys = Object.keys(localStorage);
  const tensorflowKeys = keys.filter((key) =>
    key.includes("tensorflowjs_models")
  );
  const uniqueModels = Array.from(
    new Set(
      tensorflowKeys
        .map((string) => string.split("/"))
        .map((string) => string[1])
    )
  );


  // Check if there are any models saved
  if (uniqueModels.length === 0) {
    const noModelsMessage = document.createElement("p");
    noModelsMessage.classList.add("text-xl", "text-gray-600");
    noModelsMessage.textContent = "No models saved yet!";
    modelGrid.appendChild(noModelsMessage);
    return;
  }


  uniqueModels.forEach((model) => {
    const modelInfoKey = `tensorflowjs_models/${model}/info`;
    const modelInfo = JSON.parse(localStorage.getItem(modelInfoKey));
    const modelName = model;
    const lastTrained = new Date(modelInfo.dateSaved).toLocaleString();

    const modelTopologyKey = `tensorflowjs_models/${model}/model_topology`;
    const { modelType, modelTopology } = summarizeModelTopology(
      localStorage.getItem(modelTopologyKey)
    );

    const modelCard = createModelCard(
      modelName,
      modelType,
      lastTrained,
      modelTopology
    );
    modelGrid.appendChild(modelCard);
  });
}

function summarizeModelTopology(jsonString) {
  const modelSummary = JSON.parse(jsonString);
  const modelConfig = JSON.parse(jsonString).config;
  const layers = modelConfig.layers;
  const layerDetails = layers
    .map((layer) => {
      const layerConfig = layer.config;
      return `${layer.class_name} layer with ${layerConfig.units} units and ${layerConfig.activation} activation function`;
    })
    .join(", ");

  return { modelType: modelSummary.class_name, modelTopology: layerDetails };
}

// Load the models when the page loads
loadModels();
