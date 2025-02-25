// Diccionario de 30 ciudades con coordenadas (latitud y longitud)
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

// Llenar el menú de ciudades en la calculadora solar
const citySelect = document.getElementById("citySelect");
Object.keys(cities).forEach(city => {
  const option = document.createElement("option");
  option.value = city;
  option.textContent = city;
  citySelect.appendChild(option);
});

// Función para mostrar/ocultar bloques según el método de entrada
function toggleInputs() {
  const sourceType = document.getElementById("sourceType").value;
  const cityBlock = document.getElementById("cityBlock");
  const coordsBlock = document.getElementById("coordsBlock");
  const mapContainer = document.getElementById("map");

  if (sourceType === "city") {
    cityBlock.classList.add("active"); // Mostrar bloque de ciudad
    coordsBlock.classList.remove("active"); // Ocultar bloque de coordenadas
    mapContainer.style.display = "none"; // Ocultar el mapa
  } else {
    coordsBlock.classList.add("active"); // Mostrar bloque de coordenadas
    cityBlock.classList.remove("active"); // Ocultar bloque de ciudad
    mapContainer.style.display = "none"; // Se mantendrá oculto hasta que se calcule
  }
}

// Función para obtener la radiación solar desde la API de NASA POWER
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

// Variable global para el mapa
let map = null;

// Función para inicializar/actualizar el mapa usando Leaflet con requestAnimationFrame
function updateMap(lat, lon) {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    console.error("Contenedor del mapa no encontrado");
    return;
  }

  // Asegurar que el contenedor sea visible y tenga dimensiones
  mapContainer.style.display = "block";
  mapContainer.style.height = "300px";
  mapContainer.style.width = "100%";

  // Destruir el mapa existente, si hay uno
  if (map) {
    map.remove();
    map = null;
  }

  // Inicializar el mapa tras renderizar el contenedor
  requestAnimationFrame(() => {
    map = L.map("map", {
      center: [lat, lon],
      zoom: 13
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    L.marker([lat, lon]).addTo(map);
    map.invalidateSize();
  });
}

// Función para calcular la energía generada
async function calculateEnergy() {
  const sourceType = document.getElementById("sourceType").value;
  const area = parseFloat(document.getElementById("panelArea").value);
  const efficiencyInput = parseFloat(document.getElementById("efficiency").value);
  const result = document.getElementById("result");

  // Validar el área
  if (isNaN(area) || area <= 0) {
    result.textContent = "Por favor, ingresa un área válida.";
    result.classList.add("error");
    return;
  }
  
  // Validar la eficiencia (entre 1% y 100%)
  if (isNaN(efficiencyInput) || efficiencyInput < 1 || efficiencyInput > 100) {
    result.textContent = "Error: La eficiencia debe estar entre 1% y 100%.";
    result.classList.add("error");
    return;
  }

  result.classList.remove("error");
  const efficiency = efficiencyInput / 100;
  let lat, lon;

  // Obtener coordenadas según el método seleccionado
  if (sourceType === "city") {
    const selectedCity = citySelect.value;
    if (!cities[selectedCity]) {
      result.textContent = "Ciudad no encontrada en la lista.";
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

  // Mostrar el mapa (se actualizará en ambos casos)
  updateMap(lat, lon);

  // Obtener la radiación solar usando la API
  const radiation = await getSolarRadiation(lat, lon);
  if (!radiation) {
    result.textContent = "No se pudo obtener la radiación solar.";
    result.classList.add("error");
    return;
  }

  // Calcular energía diaria y mensual
  const dailyEnergy = radiation * area * efficiency;
  const monthlyEnergy = dailyEnergy * 30; // Suponiendo 30 días en un mes

  result.innerHTML = `Energía generada: ${dailyEnergy.toFixed(2)} kWh/día<br>
                      Promedio mensual: ${monthlyEnergy.toFixed(2)} kWh/mes`;
}

// Función para calcular estadísticas desde el textarea
function calculateStats() {
  const input = document.getElementById("dataInput").value;
  const statsResult = document.getElementById("statsResult");

  if (!input) {
    statsResult.textContent = "Por favor, ingresa datos.";
    statsResult.classList.add("error");
    return;
  }

  // Convertir cadena a arreglo numérico
  let data = input.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));

  if (data.length === 0) {
    statsResult.textContent = "Por favor, ingresa datos numéricos válidos.";
    statsResult.classList.add("error");
    return;
  }

  // Calcular media
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;

  // Calcular mediana
  data.sort((a, b) => a - b);
  let median;
  const mid = Math.floor(data.length / 2);
  if (data.length % 2 === 0) {
    median = (data[mid - 1] + data[mid]) / 2;
  } else {
    median = data[mid];
  }

  // Calcular moda
  const frequency = {};
  let maxFreq = 0;
  data.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
    }
  });
  let mode = [];
  for (let num in frequency) {
    if (frequency[num] === maxFreq) {
      mode.push(Number(num));
    }
  }
  if (mode.length === data.length) {
    mode = "No hay moda";
  } else {
    mode = mode.join(", ");
  }

  statsResult.classList.remove("error");
  statsResult.innerHTML = `<strong>Media:</strong> ${mean.toFixed(2)}<br>
                           <strong>Mediana:</strong> ${median}<br>
                           <strong>Moda:</strong> ${mode}`;
}

// Función para calcular estadísticas desde un archivo
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
    // Separar datos usando comas, espacios o saltos de línea
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
        let median;
        const mid = Math.floor(data.length / 2);
        if (data.length % 2 === 0) {
          median = (data[mid - 1] + data[mid]) / 2;
        } else {
          median = data[mid];
        }
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
          if (freq[num] === maxFreq) {
            modes.push(Number(num));
          }
        }
        if (modes.length === data.length) {
          output = "Moda: No hay moda";
        } else {
          output = "Moda: " + modes.join(", ");
        }
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
