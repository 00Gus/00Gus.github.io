// Diccionario de ciudades con coordenadas (Latitud, Longitud)
const cities = {
    "CDMX": { lat: 19.43, lon: -99.13 },
    "Guadalajara": { lat: 20.67, lon: -103.35 },
    "Monterrey": { lat: 25.67, lon: -100.31 },
    "Mérida": { lat: 20.97, lon: -89.62 },
    "Cancún": { lat: 21.17, lon: -86.85 },
    "Morelia": { lat: 19.70, lon: -101.19 },
    "Chihuahua": { lat: 28.63, lon: -106.08 },
    "Tijuana": { lat: 32.52, lon: -117.02 },
    "Puebla": { lat: 19.04, lon: -98.20 },
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

// Llenar el menú de selección con las ciudades
const citySelect = document.getElementById("city");
Object.keys(cities).forEach(city => {
    let option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
});

// Función para obtener la radiación solar de la API de NASA
async function getSolarRadiation(city) {
    if (!cities[city]) return null;
    
    const { lat, lon } = cities[city];
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON&start=20240101&end=20240101`;

    try {
        let response = await fetch(url);
        let data = await response.json();
        return data.properties.parameter.ALLSKY_SFC_SW_DWN["20240101"];
    } catch (error) {
        console.error("Error obteniendo datos", error);
        return null;
    }
}

// Función para calcular la energía generada
async function calculateEnergy() {
    let city = citySelect.value;
    let area = parseFloat(document.getElementById("panelArea").value);
    let efficiency = parseFloat(document.getElementById("efficiency").value) / 100;

    let radiation = await getSolarRadiation(city);
    if (!radiation) {
        alert("No se pudo obtener la radiación solar.");
        return;
    }

    let energy = radiation * area * efficiency;
    document.getElementById("result").innerHTML = `Energía generada: ${energy.toFixed(2)} kWh/día`;
}
