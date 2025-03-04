/**********************
 * Diccionario de 30 ciudades con coordenadas
 **********************/
const cities = {
  "CDMX": { lat: 19.43, lon: -99.13 },
  "Guadalajara": { lat: 20.67, lon: -103.35 },
  "Monterrey": { lat: 25.67, lon: -100.31 },
  "Morelia": { lat: 19.70, lon: -101.19 },
  "Cancún": { lat: 21.17, lon: -86.85 },
  "Tijuana": { lat: 32.52, lon: -117.02 },
  "Puebla": { lat: 19.04, lon: -98.20 },
  "Chihuahua": { lat: 28.63, lon: -106.08 },
  "León": { lat: 21.12, lon: -101.68 },
  "Toluca": { lat: 19.29, lon: -99.65 },
  "Querétaro": { lat: 20.59, lon: -100.39 },
  "Aguascalientes": { lat: 21.88, lon: -102.29 },
  "San Luis Potosí": { lat: 22.15, lon: -100.98 },
  "Culiacán": { lat: 24.80, lon: -107.39 },
  "Hermosillo": { lat: 29.07, lon: -110.95 },
  "Veracruz": { lat: 19.19, lon: -96.14 },
  "Saltillo": { lat: 25.42, lon: -101.00 },
  "Tampico": { lat: 22.25, lon: -97.86 },
  "Villahermosa": { lat: 17.99, lon: -92.93 },
  "Oaxaca": { lat: 17.07, lon: -96.72 },
  "Tuxtla Gutiérrez": { lat: 16.75, lon: -93.12 },
  "Chetumal": { lat: 18.50, lon: -88.30 },
  "Campeche": { lat: 19.84, lon: -90.53 },
  "La Paz": { lat: 24.14, lon: -110.31 },
  "Mazatlán": { lat: 23.22, lon: -106.42 },
  "Irapuato": { lat: 20.67, lon: -101.35 },
  "Mexicali": { lat: 32.63, lon: -115.45 },
  "Colima": { lat: 19.24, lon: -103.72 },
  "Cuernavaca": { lat: 18.92, lon: -99.23 }
};

/**********************
 * Llenar el <select> de ciudades
 **********************/
const citySelect = document.getElementById("citySelect");
Object.keys(cities).forEach(city => {
  const option = document.createElement("option");
  option.value = city;
  option.textContent = city;
  citySelect.appendChild(option);
});

/**********************
 * Función para mostrar secciones y actualizar el fondo
 **********************/
function showSection(sectionId) {
  const sections = ["solarSection", "panelSection", "dataSection", "analysisSection", "helpSection"];
  sections.forEach(id => {
    document.getElementById(id).style.display = (id === sectionId) ? "block" : "none";
  });

  const hero = document.getElementById("heroSection");
  if (hero) { hero.style.display = "none"; }

  if (sectionId === "solarSection") {
    document.body.style.backgroundImage = "url('calculadora.png')";
  } else if (sectionId === "panelSection") {
    document.body.style.backgroundImage = "url('Panelsolar.png')";
  } else {
    document.body.style.backgroundImage = "url('solar_image.png')";
  }

  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center center";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**********************
 * Función para mostrar/ocultar inputs según el tipo de entrada en la Calculadora Solar
 **********************/
function toggleInputs() {
  const sourceType = document.getElementById("sourceType").value;
  const cityBlock = document.getElementById("cityBlock");
  const coordsBlock = document.getElementById("coordsBlock");
  const mapContainer = document.getElementById("map");

  if (sourceType === "city") {
    cityBlock.classList.add("active");
    coordsBlock.classList.remove("active");
    mapContainer.style.display = "none";
  } else {
    coordsBlock.classList.add("active");
    cityBlock.classList.remove("active");
    mapContainer.style.display = "none";
  }
}

/**********************
 * Función para obtener la radiación solar desde la API de NASA
 **********************/
async function getSolarRadiation(lat, lon) {
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON&start=20240101&end=20240101`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.properties.parameter.ALLSKY_SFC_SW_DWN["20240101"];
  } catch (error) {
    console.error("Error obteniendo datos de la API NASA:", error);
    return null;
  }
}

/**********************
 * Función para actualizar el mapa usando Leaflet
 **********************/
let map = null;
function updateMap(lat, lon) {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;
  mapContainer.style.display = "block";
  mapContainer.style.height = "300px";

  if (map) {
    map.remove();
    map = null;
  }

  requestAnimationFrame(() => {
    map = L.map("map", { center: [lat, lon], zoom: 13 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    L.marker([lat, lon]).addTo(map);
    map.invalidateSize();
  });
}

/**********************
 * Variable global para la energía generada (energía mensual)
 **********************/
let monthlyEnergy = 0;

/**********************
 * Función para calcular la energía generada por el panel
 **********************/
async function calculateEnergy() {
  const sourceType = document.getElementById("sourceType").value;
  const area = parseFloat(document.getElementById("panelArea").value);
  const efficiencyInput = parseFloat(document.getElementById("efficiency").value);
  const result = document.getElementById("result");

  if (isNaN(area) || area <= 0) {
    result.textContent = "Por favor, ingresa un área válida.";
    result.classList.add("error");
    return;
  }
  if (isNaN(efficiencyInput) || efficiencyInput < 1 || efficiencyInput > 100) {
    result.textContent = "Error: La eficiencia debe estar entre 1% y 100%.";
    result.classList.add("error");
    return;
  }

  result.classList.remove("error");
  const efficiency = efficiencyInput / 100;
  let lat, lon;

  if (sourceType === "city") {
    const selectedCity = citySelect.value;
    if (!cities[selectedCity]) {
      result.textContent = "Ciudad no encontrada.";
      result.classList.add("error");
      return;
    }
    lat = cities[selectedCity].lat;
    lon = cities[selectedCity].lon;
  } else {
    lat = parseFloat(document.getElementById("latInput").value);
    lon = parseFloat(document.getElementById("lonInput").value);
    if (isNaN(lat) || isNaN(lon)) {
      result.textContent = "Por favor, ingresa coordenadas válidas.";
      result.classList.add("error");
      return;
    }
  }

  updateMap(lat, lon);
  const radiation = await getSolarRadiation(lat, lon);
  if (!radiation) {
    result.textContent = "No se pudo obtener la radiación solar.";
    result.classList.add("error");
    return;
  }

  const dailyEnergy = radiation * area * efficiency;
  monthlyEnergy = dailyEnergy * 30;

  result.innerHTML = `
    Energía generada: ${dailyEnergy.toFixed(2)} kWh/día<br>
    Promedio mensual: ${monthlyEnergy.toFixed(2)} kWh/mes
  `;
}

/**********************
 * Función para calcular el ahorro con paneles solares
 **********************/
function calculateSavings() {
  const savingsResult = document.getElementById("savingsResult");
  const consumption = parseFloat(document.getElementById("bimonthlyConsumption").value);
  const billAmount = parseFloat(document.getElementById("bimonthlyCost").value);
  const tariff = parseFloat(document.getElementById("electricityTariff").value);

  if (isNaN(consumption) || consumption <= 0 || isNaN(billAmount) || billAmount <= 0) {
    savingsResult.textContent = "Por favor, ingresa valores válidos para consumo y monto del recibo.";
    savingsResult.classList.add("error");
    return;
  }
  if (isNaN(tariff) || tariff <= 0) {
    savingsResult.textContent = "Por favor, ingresa una tarifa eléctrica válida.";
    savingsResult.classList.add("error");
    return;
  }
  savingsResult.classList.remove("error");

  const costWithoutSolar = billAmount;
  const generatedBimonthly = monthlyEnergy * 2;
  const effectiveConsumption = Math.max(consumption - generatedBimonthly, 0);
  const costWithSolar = effectiveConsumption * tariff;
  const savings = costWithoutSolar - costWithSolar;

  savingsResult.innerHTML = `
    <strong>Costo sin paneles:</strong> $${costWithoutSolar.toFixed(2)} MXN (bimestral)<br>
    <strong>Costo con paneles:</strong> $${costWithSolar.toFixed(2)} MXN (bimestral)<br>
    <strong>Ahorro estimado:</strong> $${savings.toFixed(2)} MXN (bimestral)
  `;

  updateSavingsChart(costWithoutSolar, costWithSolar);
}

/**********************
 * Función para dibujar la gráfica comparativa con Chart.js (Ahorro)
 **********************/
let savingsChart = null;
function updateSavingsChart(costWithout, costWith) {
  const ctx = document.getElementById("savingsChart").getContext("2d");

  if (savingsChart) {
    savingsChart.destroy();
  }

  savingsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Sin paneles", "Con paneles"],
      datasets: [{
        label: "Costo Bimestral (MXN)",
        data: [costWithout, costWith],
        backgroundColor: ["#e74c3c", "#2ecc71"],
        borderColor: ["#c0392b", "#27ae60"],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

/**********************
 * Funciones para la sección "¿Cuántos paneles necesitas?"
 **********************/
function populatePanelModels() {
  const panelType = document.getElementById("panelType").value;
  const panelModelSelect = document.getElementById("panelModel");
  panelModelSelect.innerHTML = "";
  let panels = (panelType === "residential") ? residentialPanels : industrialPanels;
  Object.keys(panels).forEach(model => {
    let option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    panelModelSelect.appendChild(option);
  });
  updatePanelDescription();
}

function updatePanelDescription() {
  const panelType = document.getElementById("panelType").value;
  const panelModelSelect = document.getElementById("panelModel");
  const selectedModel = panelModelSelect.value;
  let panels = (panelType === "residential") ? residentialPanels : industrialPanels;
  const descElem = document.getElementById("panelDescription");
  if (panels[selectedModel]) {
    descElem.textContent = panels[selectedModel].desc + " (Potencia aprox.: " + panels[selectedModel].watt + "W)";
  } else {
    descElem.textContent = "";
  }
}

function calculatePanels() {
  const panelType = document.getElementById("panelType").value;
  const panelModel = document.getElementById("panelModel").value;
  const requiredArea = parseFloat(document.getElementById("requiredArea").value);
  const resultElem = document.getElementById("panelResult");
  if (isNaN(requiredArea) || requiredArea <= 0) {
    resultElem.textContent = "Por favor, ingresa un área válida.";
    resultElem.classList.add("error");
    return;
  }
  let panels = (panelType === "residential") ? residentialPanels : industrialPanels;
  if (!panels[panelModel]) {
    resultElem.textContent = "Modelo de panel no encontrado.";
    resultElem.classList.add("error");
    return;
  }
  resultElem.classList.remove("error");
  let panelArea = panels[panelModel].area;
  let quantity = Math.ceil(requiredArea / panelArea);
  resultElem.innerHTML = `Para cubrir ${requiredArea} m², se requieren aproximadamente <strong>${quantity} paneles</strong> del modelo ${panelModel}.`;
}

/**********************
 * Datos de paneles
 **********************/
const residentialPanels = {
  "SunPower Maxeon 3": { area: 1.7, watt: 370, desc: "Alta eficiencia y estética premium" },
  "LG Neon R": { area: 1.7, watt: 365, desc: "Buen rendimiento en condiciones de baja irradiación" },
  "REC Alpha Series": { area: 1.7, watt: 370, desc: "Excelente garantía y rendimiento constante" },
  "Q CELLS Q.PEAK DUO G9": { area: 1.7, watt: 365, desc: "Muy eficiente y con buena tolerancia a temperaturas elevadas" },
  "Canadian Solar HiDM": { area: 1.7, watt: 350, desc: "Buena relación calidad-precio para instalaciones residenciales" }
};

const industrialPanels = {
  "Trina Solar Vertex Series": { area: 2.0, watt: 550, desc: "Ideal para grandes instalaciones por su alta generación" },
  "Jinko Solar Eagle PERC": { area: 2.0, watt: 500, desc: "Robustez y eficiencia pensadas para aplicaciones a gran escala" },
  "LONGi Hi-MO 5": { area: 2.0, watt: 530, desc: "Link de compra: https://www.longi.com/mx/products/modules/hi-mo-5/" },
  "JA Solar DeepBlue 3.0": { area: 2.0, watt: 530, desc: "Tecnología PERC optimizada para grandes superficies" },
  "Canadian Solar BiHiKu": { area: 2.0, watt: 550, desc: "Diseñado para maximizar la producción en espacios amplios" }
};

/**********************
 * Función para manejar el cambio en el tipo de gráfica en la sección Ingresar Datos
 **********************/
function handleDataGraphTypeChange() {
  const graphType = document.getElementById("dataGraphType").value;
  const numericContainer = document.getElementById("numericDataContainer");
  const xyContainer = document.getElementById("xyDataContainer");
  if (graphType === "scatter") {
    xyContainer.style.display = "block";
    numericContainer.style.display = "none";
  } else {
    xyContainer.style.display = "none";
    numericContainer.style.display = "block";
  }
}

/**********************
 * Función para procesar datos en la sección Ingresar Datos (Gráficas)
 **********************/
function processData() {
  const graphType = document.getElementById("dataGraphType").value;
  const resultContainer = document.getElementById("customDataResult");
  const ctx = document.getElementById("dataChart").getContext("2d");

  // Destruir gráfica anterior si existe
  if (window.dataChartInstance) {
    window.dataChartInstance.destroy();
  }

  if (graphType === "scatter") {
    let xyInput = document.getElementById("xyDataInput").value.trim();
    let scatterData = [];
    if (xyInput) {
      // Se espera el formato: "x,y; x,y; x,y"
      const pairs = xyInput.split(";").map(pair => pair.trim()).filter(pair => pair !== "");
      let valid = true;
      pairs.forEach(pair => {
        const nums = pair.split(",").map(n => Number(n.trim()));
        if (nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) {
          valid = false;
        } else {
          scatterData.push({ x: nums[0], y: nums[1] });
        }
      });
      if (!valid || scatterData.length === 0) {
        alert("Por favor ingresa datos XY válidos en el formato: x,y; x,y; ...");
        return;
      }
    } else {
      for (let i = 0; i < 20; i++) {
        scatterData.push({ x: Math.random() * 100, y: Math.random() * 100 });
      }
    }
    renderScatter(ctx, scatterData);
  } else {
    let input = document.getElementById("customDataInput").value;
    if (!input.trim()) {
      resultContainer.innerHTML = '<span class="error">Por favor, ingresa datos.</span>';
      return;
    }
    let data = input.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
    if (data.length === 0) {
      resultContainer.innerHTML = '<span class="error">Datos no válidos.</span>';
      return;
    }
    let sum = data.reduce((a, b) => a + b, 0);
    let mean = sum / data.length;
    resultContainer.innerHTML = `<p>Media: ${mean.toFixed(2)}</p>`;
    if (graphType === "histogram") {
      renderHistogram(ctx, data);
    } else if (graphType === "boxplot") {
      renderBoxplot(ctx, data);
    }
  }
}

/**********************
 * Función para renderizar Histograma
 **********************/
function renderHistogram(ctx, data) {
  const bins = 10;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;
  let counts = new Array(bins).fill(0);
  data.forEach(x => {
    let index = Math.floor((x - min) / binWidth);
    if (index === bins) index = bins - 1;
    counts[index]++;
  });
  let labels = [];
  for (let i = 0; i < bins; i++) {
    labels.push(`${(min + i * binWidth).toFixed(1)} - ${(min + (i + 1) * binWidth).toFixed(1)}`);
  }
  window.dataChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Frecuencia",
        data: counts,
        backgroundColor: "#2ecc71",
        borderColor: "#27ae60",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Frecuencia" } },
        x: { title: { display: true, text: "Intervalos" } }
      }
    }
  });
}

/**********************
 * Función para renderizar Boxplot
 **********************/
function renderBoxplot(ctx, data) {
  window.dataChartInstance = new Chart(ctx, {
    type: 'boxplot',
    data: {
      labels: ['Distribución'],
      datasets: [{
        label: 'Boxplot de Datos',
        data: [data],
        backgroundColor: 'rgba(52, 152, 219, 0.5)',
        borderColor: 'rgba(41, 128, 185, 1)',
        borderWidth: 1,
        outlierColor: '#e74c3c',
        padding: 10,
        itemRadius: 0
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

/**********************
 * Función para renderizar ScatterPlot (XY) en la sección Ingresar Datos
 **********************/
function renderScatter(ctx, scatterData) {
  window.dataChartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{
        label: "Datos XY",
        data: scatterData,
        backgroundColor: "#e74c3c",
        borderColor: "#c0392b",
        borderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { beginAtZero: true, title: { display: true, text: "Eje X" } },
        y: { beginAtZero: true, title: { display: true, text: "Eje Y" } }
      }
    }
  });
}

/**********************
 * Función para el Análisis Estadístico (solo resultado textual)
 **********************/
function calculateStatsOnly() {
  const input = document.getElementById("analysisInput").value;
  const resultElem = document.getElementById("analysisResult");

  if (!input) {
    resultElem.innerHTML = `<span class="error">Por favor, ingresa datos.</span>`;
    return;
  }

  let data = input.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
  if (data.length === 0) {
    resultElem.innerHTML = `<span class="error">Por favor, ingresa datos numéricos válidos.</span>`;
    return;
  }

  data.sort((a, b) => a - b);
  const n = data.length;
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  const median = (n % 2 === 0) ? (data[n/2 - 1] + data[n/2]) / 2 : data[Math.floor(n/2)];
  const freq = {};
  data.forEach(x => { freq[x] = (freq[x] || 0) + 1; });
  let mode = Object.keys(freq).filter(x => freq[x] === Math.max(...Object.values(freq)));
  mode = (mode.length === n) ? "No hay moda" : mode.join(", ");
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stddev = Math.sqrt(variance);
  const skewness = data.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / (n * Math.pow(stddev, 3));
  const kurtosis = (data.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / (n * Math.pow(stddev, 4))) - 3;
  const Q1 = (n % 2 === 0) ? medianOf(data.slice(0, n/2)) : medianOf(data.slice(0, Math.floor(n/2)));
  const Q3 = (n % 2 === 0) ? medianOf(data.slice(n/2)) : medianOf(data.slice(Math.ceil(n/2)));
  const IQR = Q3 - Q1;

  resultElem.innerHTML = `
    <strong>Media:</strong> ${mean.toFixed(2)}<br>
    <strong>Mediana:</strong> ${median}<br>
    <strong>Moda:</strong> ${mode}<br>
    <strong>Desviación Estándar:</strong> ${stddev.toFixed(2)}<br>
    <strong>Sesgo:</strong> ${skewness.toFixed(2)}<br>
    <strong>Curtosis:</strong> ${kurtosis.toFixed(2)}<br>
    <strong>Cuartiles:</strong> Q1 = ${Q1}, Mediana = ${median}, Q3 = ${Q3}<br>
    <strong>IQR:</strong> ${IQR.toFixed(2)}
  `;
}

function medianOf(arr) {
  const len = arr.length;
  return (len % 2 === 0) ? (arr[len/2 - 1] + arr[len/2]) / 2 : arr[Math.floor(len/2)];
}

/**********************
 * Función para ocultar la sección de Ayuda y volver al inicio
 **********************/
function hideHelp() {
  document.getElementById("helpSection").style.display = "none";
  document.getElementById("heroSection").style.display = "flex";
  document.body.style.backgroundImage = "url('solar_image.png')";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function returnHome() {
  document.getElementById("solarSection").style.display = "none";
  document.getElementById("panelSection").style.display = "none";
  document.getElementById("dataSection").style.display = "none";
  document.getElementById("analysisSection").style.display = "none";
  document.getElementById("helpSection").style.display = "none";
  document.getElementById("heroSection").style.display = "flex";
  document.body.style.backgroundImage = "url('solar_image.png')";
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center center";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
