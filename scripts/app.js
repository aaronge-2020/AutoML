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
    "mt-4",
    "hover:bg-blue-600"
  );
  loadModelButton.textContent = "Load and Test Model";
  loadModelButton.addEventListener("click", () => {
    // Add code here to load and test the model in another page
    console.log("Loading and testing model...");
  });

  modelCard.appendChild(modelTitle);
  modelCard.appendChild(modelDesc);
  modelCard.appendChild(modelTop);
  modelCard.appendChild(lastTrainedText);
  modelCard.appendChild(loadModelButton);
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
