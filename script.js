// Registrar el controlador y elemento del boxplot (asegúrate de que el plugin se haya cargado)
if (typeof BoxPlotController !== 'undefined' && typeof BoxAndWiskersElement !== 'undefined') {
  Chart.register(BoxPlotController, BoxAndWiskersElement);
}

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
  const sections = ["solarSection", "statsSection", "panelSection"];
  sections.forEach(id => {
    document.getElementById(id).style.display = (id === sectionId) ? "block" : "none";
  });
  // Ocultar el Hero
  const hero = document.getElementById("heroSection");
  if (hero) { hero.style.display = "none"; }
  // Actualizar el fondo según la sección
  if (sectionId === "solarSection") {
    document.body.style.backgroundImage = "url('calculadora.png')";
  } else if (sectionId === "statsSection") {
    document.body.style.backgroundImage = "url('Estadistica.png')";
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
 * Función para mostrar/ocultar inputs según el tipo de entrada
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
 * Función para actualizar el mapa usando Leaflet con requestAnimationFrame
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

  const dailyEnergy = radiation * area * efficiency; // kWh/día
  monthlyEnergy = dailyEnergy * 30;                  // kWh/mes

  result.innerHTML = `
    Energía generada: ${dailyEnergy.toFixed(2)} kWh/día<br>
    Promedio mensual: ${monthlyEnergy.toFixed(2)} kWh/mes
  `;
}

/**********************
 * Función para calcular el ahorro con paneles solares
 * (recibo bimestral en México)
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

  const costWithoutSolar = billAmount; // bimestral
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
 * Función para dibujar la gráfica comparativa con Chart.js
 **********************/
let savingsChart = null;
function updateSavingsChart(costWithout, costWith) {
  const ctx = document.getElementById("savingsChart").getContext("2d");

  if (savingsChart) {
    savingsChart.destroy();
    savingsChart = null;
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
 * Funciones de Análisis Estadístico Extendido
 * Calcula media, mediana, moda, desviación estándar, sesgo, curtosis y cuartiles
 **********************/
function calculateExtendedStats() {
  const input = document.getElementById("dataInput").value;
  const resultElem = document.getElementById("extendedStatsResult");

  if (!input) {
    resultElem.innerHTML = `<span class="error">Por favor, ingresa datos.</span>`;
    return;
  }

  let data = input.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
  if (data.length === 0) {
    resultElem.innerHTML = `<span class="error">Por favor, ingresa datos numéricos válidos.</span>`;
    return;
  }

  // Ordenar datos
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
  
  // Actualizamos la gráfica según el tipo seleccionado.
  renderGraph();
}

function medianOf(arr) {
  const len = arr.length;
  return (len % 2 === 0) ? (arr[len/2 - 1] + arr[len/2]) / 2 : arr[Math.floor(len/2)];
}

/**********************
 * Función para mostrar/ocultar los inputs de X y Y cuando se selecciona Scatter
 **********************/
function toggleXYInputs() {
  const graphType = document.getElementById("graphType").value;
  const xyInputs = document.getElementById("xyInputs");
  // Si se selecciona scatter, mostramos los inputs para X y Y; de lo contrario, se ocultan.
  if (graphType === "scatter") {
    xyInputs.style.display = "block";
  } else {
    xyInputs.style.display = "none";
  }
}

/**********************
 * Función para renderizar gráficas (Histograma, Boxplot, Scatter)
 **********************/
let statsChart = null;
function renderGraph() {
  const graphType = document.getElementById("graphType").value;
  const ctx = document.getElementById("statsChart").getContext("2d");

  // Destruir el gráfico anterior, si existe.
  if (statsChart) {
    statsChart.destroy();
    statsChart = null;
  }

  if (graphType === "histogram") {
    const input = document.getElementById("dataInput").value;
    if (!input.trim()) {
      alert("Por favor, ingresa datos numéricos separados por comas.");
      return;
    }
    let data = input.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
    if (data.length === 0) {
      alert("Los datos ingresados no son válidos.");
      return;
    }
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

    const labels = [];
    for (let i = 0; i < bins; i++) {
      labels.push(`${(min + i * binWidth).toFixed(1)} - ${(min + (i + 1) * binWidth).toFixed(1)}`);
    }

    statsChart = new Chart(ctx, {
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
          y: {
            beginAtZero: true,
            title: { display: true, text: "Frecuencia" }
          },
          x: {
            title: { display: true, text: "Intervalos" }
          }
        }
      }
    });
  } else if (graphType === "boxplot") {
    const input = document.getElementById("dataInput").value;
    if (!input.trim()) {
      alert("Por favor, ingresa datos numéricos separados por comas.");
      return;
    }
    let data = input.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
    if (data.length === 0) {
      alert("Los datos ingresados no son válidos.");
      return;
    }
    statsChart = new Chart(ctx, {
      type: 'boxplot',
      data: {
        labels: ['Datos'],
        datasets: [{
          label: 'Boxplot',
          data: [data],
          backgroundColor: "#3498db",
          borderColor: "#2980b9",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Valores" }
          }
        }
      }
    });
  } else if (graphType === "scatter") {
    // Para scatter usamos los inputs de X y Y.
    const xInputValue = document.getElementById("xInput").value;
    const yInputValue = document.getElementById("yInput").value;
    let xValues = xInputValue.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
    let yValues = yInputValue.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
    if(xValues.length === 0 || yValues.length === 0){
      alert("Por favor, ingresa valores válidos para X y Y.");
      return;
    }
    if(xValues.length !== yValues.length){
      alert("La cantidad de valores para X y Y debe ser la misma.");
      return;
    }
    const scatterData = xValues.map((x, i) => ({ x: x, y: yValues[i] }));
    statsChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Datos XY',
          data: scatterData,
          backgroundColor: "#e67e22"
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: { display: true, text: "X" }
          },
          y: {
            title: { display: true, text: "Y" }
          }
        }
      }
    });
  }
}

/**********************
 * Función para calcular estadísticas desde un archivo
 **********************/
function calculateFileStats() {
  const fileInput = document.getElementById("dataFile");
  const metric = document.getElementById("metricSelect").value;
  const resultElem = document.getElementById("fileStatsResult");

  if (fileInput.files.length === 0) {
    resultElem.textContent = "Por favor, selecciona un archivo.";
    resultElem.classList.add("error");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    let data = content.split(/[\s,]+/).map(x => Number(x.trim())).filter(x => !isNaN(x) && x !== "");
    if (data.length === 0) {
      resultElem.textContent = "El archivo no contiene datos numéricos válidos.";
      resultElem.classList.add("error");
      return;
    }
    resultElem.classList.remove("error");
    let output = "";
    switch(metric) {
      case "mean":
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        output = `Media: ${mean.toFixed(2)}`;
        break;
      case "median":
        data.sort((a, b) => a - b);
        const mid = Math.floor(data.length / 2);
        let median = (data.length % 2 === 0) ? (data[mid - 1] + data[mid]) / 2 : data[mid];
        output = `Mediana: ${median.toFixed(2)}`;
        break;
      case "mode":
        let freq = {};
        let maxFreq = 0;
        data.forEach(num => {
          freq[num] = (freq[num] || 0) + 1;
          if (freq[num] > maxFreq) maxFreq = freq[num];
        });
        let modes = [];
        for (let num in freq) {
          if (freq[num] === maxFreq) modes.push(Number(num));
        }
        output = (modes.length === data.length) ? "Moda: No hay moda" : "Moda: " + modes.join(", ");
        break;
      case "stddev":
        const meanVal = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - meanVal, 2), 0) / data.length;
        const stddev = Math.sqrt(variance);
        output = `Desviación Estándar: ${stddev.toFixed(2)}`;
        break;
      default:
        output = "Métrica no válida.";
    }
    resultElem.textContent = output;
  };
  reader.onerror = function() {
    resultElem.textContent = "Error al leer el archivo.";
    resultElem.classList.add("error");
  };
  reader.readAsText(file);
}

/**********************
 * Función para volver al inicio y restablecer el fondo
 **********************/
function returnHome() {
  document.getElementById("solarSection").style.display = "none";
  document.getElementById("statsSection").style.display = "none";
  document.getElementById("panelSection").style.display = "none";
  document.getElementById("heroSection").style.display = "flex";
  // Restablecer el fondo al original
  document.body.style.backgroundImage = "url('solar_image.png')";
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center center";
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  "LONGi Hi-MO 4": { area: 2.0, watt: 530, desc: "Link de compra: https://www.longi.com/mx/products/modules/hi-mo-5/\n" },
  "JA Solar DeepBlue 3.0": { area: 2.0, watt: 530, desc: "Tecnología PERC optimizada para grandes superficies" },
  "Canadian Solar BiHiKu": { area: 2.0, watt: 550, desc: "Diseñado para maximizar la producción en espacios amplios" }
};
