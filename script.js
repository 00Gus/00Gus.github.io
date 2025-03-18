document.addEventListener("DOMContentLoaded", function() {

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
   * Llenar el <select> de ciudades y seleccionar por defecto "CDMX"
   **********************/
  const citySelect = document.getElementById("citySelect");
  Object.keys(cities).forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });
  citySelect.value = "CDMX";

  /**********************
   * Función para mostrar secciones y actualizar el fondo
   **********************/
  window.showSection = function(sectionId) {
    const sections = ["solarSection", "panelSection", "dataSection", "analysisSection", "regressionSection", "parabolaSection", "planeSection", "algebraSection", "helpSection"];
    sections.forEach(id => {
      document.getElementById(id).style.display = (id === sectionId) ? "block" : "none";
    });
    const hero = document.getElementById("heroSection");
    if (hero) { hero.style.display = "none"; }
    // Actualizar fondo según la sección
    if (sectionId === "solarSection") {
      document.body.style.backgroundImage = "url('calculadora.png')";
    } else if (sectionId === "panelSection") {
      document.body.style.backgroundImage = "url('Panelsolar.png')";
    } else if (sectionId === "dataSection" || sectionId === "analysisSection") {
      document.body.style.backgroundImage = "url('Estadistica.png')";
    } else if (sectionId === "regressionSection") {
      document.body.style.backgroundImage = "url('Regresion.png')";
    } else if (sectionId === "parabolaSection" || sectionId === "planeSection") {
      document.body.style.backgroundImage = "url('graficas.png')";
    } else if (sectionId === "algebraSection") {
      document.body.style.backgroundImage = "url('matrices.png')";
    } else {
      document.body.style.backgroundImage = "url('solar_image.png')";
    }
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**********************
   * Función para mostrar/ocultar inputs según el tipo de entrada en la Calculadora Solar
   **********************/
  window.toggleInputs = function() {
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
  };

  /**********************
   * Función para obtener la radiación solar desde la API de NASA
   **********************/
  window.getSolarRadiation = async function(lat, lon) {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON&start=20240101&end=20240101`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.properties.parameter.ALLSKY_SFC_SW_DWN["20240101"];
    } catch (error) {
      console.error("Error obteniendo datos de la API NASA:", error);
      return null;
    }
  };

  /**********************
   * Función para actualizar el mapa usando Leaflet
   **********************/
  let map = null;
  window.updateMap = function(lat, lon) {
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
  };

  /**********************
   * Función para calcular la energía generada por el panel
   **********************/
  window.calculateEnergy = async function() {
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
      result.innerHTML = `<span class="error">No se pudo obtener la radiación solar. Inténtalo más tarde.</span>`;
      return;
    }
    const dailyEnergy = radiation * area * efficiency;
    monthlyEnergy = dailyEnergy * 30;
    result.innerHTML = `
      Energía generada: ${dailyEnergy.toFixed(2)} kWh/día<br>
      Promedio mensual: ${monthlyEnergy.toFixed(2)} kWh/mes
    `;
  };

  /**********************
   * Función para calcular el ahorro con paneles solares
   **********************/
  window.calculateSavings = function() {
    const savingsResult = document.getElementById("savingsResult");
    const consumption = parseFloat(document.getElementById("bimonthlyConsumption").value);
    const billAmount = parseFloat(document.getElementById("bimonthlyCost").value);
    const tariff = parseFloat(document.getElementById("electricityTariff").value);
    if (isNaN(consumption) || consumption <= 0 ||
        isNaN(billAmount) || billAmount <= 0) {
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
  };

  /**********************
   * Gráfica comparativa con Chart.js (Ahorro)
   **********************/
  let savingsChart = null;
  window.updateSavingsChart = function(costWithout, costWith) {
    const ctx = document.getElementById("savingsChart").getContext("2d");
    if (savingsChart) { savingsChart.destroy(); }
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
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  };

  /**********************
   * Sección: ¿Cuántos paneles necesitas?
   **********************/
  window.populatePanelModels = function() {
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
  };

  window.updatePanelDescription = function() {
    const panelType = document.getElementById("panelType").value;
    const panelModelSelect = document.getElementById("panelModel");
    const selectedModel = panelModelSelect.value;
    let panels = (panelType === "residential") ? residentialPanels : industrialPanels;
    const descElem = document.getElementById("panelDescription");
    if (panels[selectedModel]) {
      descElem.textContent = panels[selectedModel].desc + " (Potencia aprox.: " + panels[selectedModel].watt + "W)";
    } else { descElem.textContent = ""; }
  };

  window.calculatePanels = function() {
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
  };

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
   * Sección: Ingresar Datos
   **********************/
  window.toggleDataInputData = function() {
    const method = document.getElementById("dataInputMethodData").value;
    if(method === "manual") {
      document.getElementById("dataManualContainer").style.display = "block";
      document.getElementById("dataFileContainer").style.display = "none";
    } else {
      document.getElementById("dataManualContainer").style.display = "none";
      document.getElementById("dataFileContainer").style.display = "block";
    }
  };

  window.processData = function() {
    const method = document.getElementById("dataInputMethodData").value;
    const graphType = document.getElementById("dataGraphType").value;
    const resultContainer = document.getElementById("customDataResult");
    const ctx = document.getElementById("dataChart").getContext("2d");
    if(window.dataChartInstance) { window.dataChartInstance.destroy(); }
    if(method === "file") {
      const fileInput = document.getElementById("dataFileUpload");
      if(!fileInput.files.length) { alert("Por favor, selecciona un archivo Excel."); return; }
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if(graphType === "scatter") {
          let scatterData = [];
          jsonData.forEach(row => {
            if(row.length >= 2) {
              let x = parseFloat(row[0]), y = parseFloat(row[1]);
              if(!isNaN(x) && !isNaN(y)) scatterData.push({x: x, y: y});
            }
          });
          if(scatterData.length === 0) { alert("No se encontraron datos válidos para gráfico XY en el archivo."); return; }
          renderScatter(ctx, scatterData);
        } else {
          let fileData = [];
          jsonData.forEach(row => {
            row.forEach(val => {
              let num = parseFloat(val);
              if(!isNaN(num)) fileData.push(num);
            });
          });
          if(fileData.length === 0) { alert("No se encontraron datos válidos en el archivo."); return; }
          let sum = fileData.reduce((a, b) => a + b, 0);
          let mean = sum / fileData.length;
          resultContainer.innerHTML = `<p>Media: ${mean.toFixed(2)}</p>`;
          if(graphType === "histogram") {
            renderHistogram(ctx, fileData);
          } else if(graphType === "boxplot") {
            renderBoxplot(ctx, fileData);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      if(graphType === "scatter") {
        let xyInput = document.getElementById("xyDataInput").value.trim();
        let scatterData = [];
        if(xyInput) {
          const pairs = xyInput.split(";").map(pair => pair.trim()).filter(pair => pair !== "");
          let valid = true;
          pairs.forEach(pair => {
            const nums = pair.split(",").map(n => Number(n.trim()));
            if(nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) { valid = false; }
            else { scatterData.push({x: nums[0], y: nums[1]}); }
          });
          if(!valid || scatterData.length === 0) {
            alert("Por favor ingresa datos XY válidos en el formato: x,y; x,y; ...");
            return;
          }
        } else {
          for(let i = 0; i < 20; i++) {
            scatterData.push({x: Math.random()*100, y: Math.random()*100});
          }
        }
        renderScatter(ctx, scatterData);
      } else {
        let input = document.getElementById("customDataInput").value;
        if(!input.trim()) {
          resultContainer.innerHTML = '<span class="error">Por favor, ingresa datos.</span>';
          return;
        }
        let data = input.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
        if(data.length === 0) {
          resultContainer.innerHTML = '<span class="error">Datos no válidos.</span>';
          return;
        }
        let sum = data.reduce((a, b) => a + b, 0);
        let mean = sum / data.length;
        resultContainer.innerHTML = `<p>Media: ${mean.toFixed(2)}</p>`;
        if(graphType === "histogram") {
          renderHistogram(ctx, data);
        } else if(graphType === "boxplot") {
          renderBoxplot(ctx, data);
        }
      }
    }
  };

  /**********************
   * Sección: Análisis Estadístico
   **********************/
  window.toggleStatsInput = function() {
    const method = document.getElementById("statsInputMethod").value;
    if(method === "manual") {
      document.getElementById("statsManualContainer").style.display = "block";
      document.getElementById("statsFileContainer").style.display = "none";
    } else {
      document.getElementById("statsManualContainer").style.display = "none";
      document.getElementById("statsFileContainer").style.display = "block";
    }
  };

  window.calculateStatsOnly = function() {
    const method = document.getElementById("statsInputMethod").value;
    const resultElem = document.getElementById("analysisResult");
    if(method === "file") {
      const fileInput = document.getElementById("statsFileUpload");
      if(!fileInput.files.length) { alert("Por favor, selecciona un archivo Excel."); return; }
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let fileData = [];
        jsonData.forEach(row => {
          row.forEach(val => {
            let num = parseFloat(val);
            if(!isNaN(num)) fileData.push(num);
          });
        });
        if(fileData.length === 0) { alert("No se encontraron datos válidos en el archivo."); return; }
        fileData.sort((a,b) => a-b);
        const n = fileData.length;
        const mean = fileData.reduce((sum, val) => sum + val, 0) / n;
        const median = (n % 2 === 0) ? (fileData[n/2 - 1] + fileData[n/2]) / 2 : fileData[Math.floor(n/2)];
        const freq = {};
        fileData.forEach(x => { freq[x] = (freq[x] || 0) + 1; });
        let mode = Object.keys(freq).filter(x => freq[x] === Math.max(...Object.values(freq)));
        mode = (mode.length === n) ? "No hay moda" : mode.join(", ");
        const variance = fileData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stddev = Math.sqrt(variance);
        const skewness = fileData.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / (n * Math.pow(stddev, 3));
        const kurtosis = (fileData.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / (n * Math.pow(stddev, 4))) - 3;
        const Q1 = (n % 2 === 0) ? medianOf(fileData.slice(0, n/2)) : medianOf(fileData.slice(0, Math.floor(n/2)));
        const Q3 = (n % 2 === 0) ? medianOf(fileData.slice(n/2)) : medianOf(fileData.slice(Math.ceil(n/2)));
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
      };
      reader.readAsArrayBuffer(file);
      return;
    } else {
      let input = document.getElementById("analysisInput").value;
      if(!input) {
        resultElem.innerHTML = `<span class="error">Por favor, ingresa datos.</span>`;
        return;
      }
      let data = input.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));
      if(data.length === 0) {
        resultElem.innerHTML = `<span class="error">Por favor, ingresa datos numéricos válidos.</span>`;
        return;
      }
      data.sort((a,b) => a-b);
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
  };

  function medianOf(arr) {
    const len = arr.length;
    if(len === 0) return 0;
    return (len % 2 === 0)
      ? (arr[len/2 - 1] + arr[len/2]) / 2
      : arr[Math.floor(len/2)];
  }

  /**********************
   * Sección: Regresión Lineal - Toggle de método de ingreso
   **********************/
  window.toggleDataInput = function() {
    const method = document.getElementById("dataInputMethod").value;
    if(method === "manual") {
      document.getElementById("manualInputSection").style.display = "block";
      document.getElementById("fileInputSection").style.display = "none";
    } else {
      document.getElementById("manualInputSection").style.display = "none";
      document.getElementById("fileInputSection").style.display = "block";
    }
  };

  window.processRegression = function() {
    const method = document.getElementById("dataInputMethod").value;
    if(method === "manual") { processManualRegression(); }
    else { processFileRegression(); }
  };

  function processManualRegression() {
    const input = document.getElementById("regressionInput").value.trim();
    if(!input) {
      alert("Por favor, ingresa datos en el formato: x,y; x,y; ...");
      return;
    }
    const dataPoints = parseData(input);
    if(!dataPoints) return;
    calculateAndRenderRegression(dataPoints);
  }

  function processFileRegression() {
    const fileInput = document.getElementById("fileUpload");
    if(!fileInput.files.length) {
      alert("Por favor, selecciona un archivo Excel.");
      return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if(!jsonData.length || jsonData[0].length < 2) {
        alert("El archivo debe contener al menos dos columnas (X e Y).");
        return;
      }
      const dataPoints = jsonData.map(row => ({ x: parseFloat(row[0]), y: parseFloat(row[1]) }))
                                  .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));
      if(dataPoints.length === 0) {
        alert("No se encontraron datos válidos en el archivo.");
        return;
      }
      calculateAndRenderRegression(dataPoints);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseData(input) {
    const pairs = input.split(";").map(pair => pair.trim()).filter(pair => pair !== "");
    let dataPoints = [];
    for(let pair of pairs) {
      const nums = pair.split(",").map(n => Number(n.trim()));
      if(nums.length !== 2 || isNaN(nums[0]) || isNaN(nums[1])) {
        alert("Datos no válidos. Usa el formato: x,y; x,y; ...");
        return null;
      }
      dataPoints.push({ x: nums[0], y: nums[1] });
    }
    return dataPoints;
  }

  function calculateAndRenderRegression(dataPoints) {
    const resultElem = document.getElementById("regressionResult");
    const ctx = document.getElementById("regressionChart").getContext("2d");
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    dataPoints.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
    });
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    resultElem.innerHTML = `<p>Recta de regresión: y = ${m.toFixed(2)}x + ${b.toFixed(2)}</p>`;
    const xValues = dataPoints.map(pt => pt.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const regressionLine = [
      { x: minX, y: m * minX + b },
      { x: maxX, y: m * maxX + b }
    ];
    if(window.dataChartInstance) { window.dataChartInstance.destroy(); }
    window.dataChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Datos",
            data: dataPoints,
            backgroundColor: "#e74c3c",
            borderColor: "#c0392b",
            pointRadius: 5
          },
          {
            label: "Línea de Regresión",
            data: regressionLine,
            type: "line",
            fill: false,
            borderColor: "#2ecc71",
            borderWidth: 2,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Eje X" } },
          y: { title: { display: true, text: "Eje Y" } }
        }
      }
    });
  }

  /**********************
   * Sección: Ajuste de Parábola
   **********************/
  window.toggleParabolaInput = function() {
    const method = document.getElementById("parabolaInputMethod").value;
    if(method === "manual") {
      document.getElementById("parabolaManualContainer").style.display = "block";
      document.getElementById("parabolaFileContainer").style.display = "none";
    } else {
      document.getElementById("parabolaManualContainer").style.display = "none";
      document.getElementById("parabolaFileContainer").style.display = "block";
    }
  };

  window.processParabola = function() {
    const method = document.getElementById("parabolaInputMethod").value;
    if(method === "file") {
      const fileInput = document.getElementById("parabolaFileUpload");
      if(!fileInput.files.length) { alert("Por favor, selecciona un archivo Excel."); return; }
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let dataPoints = [];
        jsonData.forEach(row => {
          if(row.length >= 2) {
            let x = parseFloat(row[0]), y = parseFloat(row[1]);
            if(!isNaN(x) && !isNaN(y)) dataPoints.push({ x: x, y: y });
          }
        });
        if(dataPoints.length === 0) { alert("No se encontraron datos válidos para el ajuste de parábola en el archivo."); return; }
        computeParabola(dataPoints);
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    const input = document.getElementById("parabolaInput").value.trim();
    if(!input) {
      alert("Por favor, ingresa datos en el formato: x,y; x,y; ...");
      return;
    }
    const dataPoints = parseData(input);
    if(!dataPoints) return;
    computeParabola(dataPoints);
  };

  function computeParabola(dataPoints) {
    const n = dataPoints.length;
    let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
    let sumY = 0, sumXY = 0, sumX2Y = 0;
    dataPoints.forEach(pt => {
      const x = pt.x, y = pt.y;
      sumX += x;
      sumX2 += x*x;
      sumX3 += x*x*x;
      sumX4 += x*x*x*x;
      sumY += y;
      sumXY += x*y;
      sumX2Y += x*x*y;
    });
    const A = [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4]
    ];
    const B = [sumY, sumXY, sumX2Y];
    let coeffs;
    try {
      coeffs = math.lusolve(math.matrix(A), math.matrix(B));
    } catch (error) {
      alert("Error en el ajuste: " + error);
      return;
    }
    const c = coeffs.get([0,0]);
    const b = coeffs.get([1,0]);
    const a = coeffs.get([2,0]);
    const resultElem = document.getElementById("parabolaResult");
    resultElem.innerHTML = `<p>Ecuación de la parábola: y = ${a.toFixed(2)}x² + ${b.toFixed(2)}x + ${c.toFixed(2)}</p>`;
    const ctx = document.getElementById("parabolaChart").getContext("2d");
    const xValues = dataPoints.map(pt => pt.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const steps = 100;
    const plotX = [];
    const plotY = [];
    for(let i = 0; i <= steps; i++) {
      const x = minX + (maxX - minX) * i / steps;
      plotX.push(x);
      plotY.push(a * x * x + b * x + c);
    }
    if(window.dataChartInstance) { window.dataChartInstance.destroy(); }
    window.dataChartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Datos",
            data: dataPoints,
            backgroundColor: "#e74c3c",
            borderColor: "#c0392b",
            pointRadius: 5
          },
          {
            label: "Parábola Ajustada",
            data: plotX.map((x, i) => ({ x: x, y: plotY[i] })),
            type: "line",
            fill: false,
            borderColor: "#2ecc71",
            borderWidth: 2,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "x" } },
          y: { title: { display: true, text: "y" } }
        }
      }
    });
  }

  /**********************
   * Sección: Ajuste de Plano (3D)
   **********************/
  window.togglePlaneDataInput = function() {
    const method = document.getElementById("planeDataInputMethod").value;
    if(method === "manual") {
      document.getElementById("planeManualContainer").style.display = "block";
      document.getElementById("planeFileContainer").style.display = "none";
    } else {
      document.getElementById("planeManualContainer").style.display = "none";
      document.getElementById("planeFileContainer").style.display = "block";
    }
  };

  window.addPlaneRow = function() {
    const tableBody = document.querySelector("#planeDataTable tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="number" step="any" class="plane-input-x"></td>
      <td><input type="number" step="any" class="plane-input-y"></td>
      <td><input type="number" step="any" class="plane-input-z"></td>
      <td><button type="button" onclick="removePlaneRow(this)">Eliminar</button></td>
    `;
    tableBody.appendChild(row);
  };

  window.removePlaneRow = function(button) {
    const row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
  };

  window.processPlane = function() {
    const method = document.getElementById("planeDataInputMethod").value;
    let dataPoints = [];
    if(method === "manual") {
      const rows = document.querySelectorAll("#planeDataTable tbody tr");
      rows.forEach(row => {
        const x = parseFloat(row.querySelector(".plane-input-x").value);
        const y = parseFloat(row.querySelector(".plane-input-y").value);
        const z = parseFloat(row.querySelector(".plane-input-z").value);
        if(!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          dataPoints.push({ x: x, y: y, z: z });
        }
      });
      if(dataPoints.length === 0) {
        alert("Por favor, ingresa datos válidos en la tabla.");
        return;
      }
      calculateAndRenderPlane(dataPoints);
    } else {
      const fileInput = document.getElementById("planeFileUpload");
      if(!fileInput.files.length) {
        alert("Por favor, selecciona un archivo Excel.");
        return;
      }
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if(!jsonData.length || jsonData[0].length < 3) {
          alert("El archivo debe contener al menos tres columnas (X, Y, Z).");
          return;
        }
        dataPoints = jsonData.map(row => ({ x: parseFloat(row[0]), y: parseFloat(row[1]), z: parseFloat(row[2]) }))
                             .filter(pt => !isNaN(pt.x) && !isNaN(pt.y) && !isNaN(pt.z));
        if(dataPoints.length === 0) {
          alert("No se encontraron datos válidos en el archivo.");
          return;
        }
        calculateAndRenderPlane(dataPoints);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  function calculateAndRenderPlane(dataPoints) {
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumZ = 0, sumXX = 0, sumYY = 0, sumXY = 0, sumXZ = 0, sumYZ = 0;
    dataPoints.forEach(pt => {
      const { x, y, z } = pt;
      sumX += x;
      sumY += y;
      sumZ += z;
      sumXX += x * x;
      sumYY += y * y;
      sumXY += x * y;
      sumXZ += x * z;
      sumYZ += y * z;
    });
    const A = [
      [sumXX, sumXY, sumX],
      [sumXY, sumYY, sumY],
      [sumX,  sumY,  n]
    ];
    const B = [sumXZ, sumYZ, sumZ];
    let coeffs;
    try {
      coeffs = math.lusolve(math.matrix(A), math.matrix(B));
    } catch (error) {
      alert("Error en el ajuste del plano: " + error);
      return;
    }
    const a = coeffs.get([0,0]);
    const b = coeffs.get([1,0]);
    const c = coeffs.get([2,0]);
    const resultElem = document.getElementById("planeResult");
    resultElem.innerHTML = `<p>Ecuación del plano: z = ${a.toFixed(2)}x + ${b.toFixed(2)}y + ${c.toFixed(2)}</p>`;
    const xVals = dataPoints.map(pt => pt.x);
    const yVals = dataPoints.map(pt => pt.y);
    const zVals = dataPoints.map(pt => pt.z);
    const tracePoints = {
      x: xVals, y: yVals, z: zVals,
      mode: 'markers', type: 'scatter3d',
      marker: { size: 4, color: '#e74c3c' },
      name: 'Datos'
    };
    const xRange = [Math.min(...xVals), Math.max(...xVals)];
    const yRange = [Math.min(...yVals), Math.max(...yVals)];
    const gridSize = 20;
    const xGrid = [];
    const yGrid = [];
    for(let i = 0; i < gridSize; i++) {
      xGrid.push(xRange[0] + (xRange[1]-xRange[0]) * i/(gridSize-1));
      yGrid.push(yRange[0] + (yRange[1]-yRange[0]) * i/(gridSize-1));
    }
    const zGrid = [];
    for(let i = 0; i < gridSize; i++) {
      let row = [];
      for(let j = 0; j < gridSize; j++) {
        row.push(a * xGrid[j] + b * yGrid[i] + c);
      }
      zGrid.push(row);
    }
    const traceSurface = {
      x: xGrid, y: yGrid, z: zGrid,
      type: 'surface', opacity: 0.5,
      colorscale: 'Viridis', name: 'Plano Ajustado'
    };
    Plotly.purge('planeChart');
    const layout = {
      title: 'Ajuste de Plano (3D)',
      autosize: true,
      scene: { xaxis: { title: 'X' }, yaxis: { title: 'Y' }, zaxis: { title: 'Z' } }
    };
    Plotly.newPlot('planeChart', [tracePoints, traceSurface], layout);
  }

  /**********************
   * Toggles para secciones adicionales
   **********************/
  window.toggleStatsInput = function() {
    const method = document.getElementById("statsInputMethod").value;
    if(method === "manual") {
      document.getElementById("statsManualContainer").style.display = "block";
      document.getElementById("statsFileContainer").style.display = "none";
    } else {
      document.getElementById("statsManualContainer").style.display = "none";
      document.getElementById("statsFileContainer").style.display = "block";
    }
  };

  window.toggleParabolaInput = function() {
    const method = document.getElementById("parabolaInputMethod").value;
    if(method === "manual") {
      document.getElementById("parabolaManualContainer").style.display = "block";
      document.getElementById("parabolaFileContainer").style.display = "none";
    } else {
      document.getElementById("parabolaManualContainer").style.display = "none";
      document.getElementById("parabolaFileContainer").style.display = "block";
    }
  };

  /**********************
   * Función para cerrar la ayuda y volver al hero
   **********************/
  window.hideHelp = function() {
    document.getElementById("helpSection").style.display = "none";
    document.getElementById("heroSection").style.display = "flex";
    document.body.style.backgroundImage = "url('solar_image.png')";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**********************
   * Función para volver al inicio (Hero) y restablecer fondo
   **********************/
  window.returnHome = function() {
    const sections = ["solarSection", "panelSection", "dataSection", "analysisSection", "regressionSection", "parabolaSection", "planeSection", "algebraSection", "helpSection"];
    sections.forEach(id => { document.getElementById(id).style.display = "none"; });
    const hero = document.getElementById("heroSection");
    hero.style.display = "flex";
    document.body.style.backgroundImage = "url('solar_image.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

});
