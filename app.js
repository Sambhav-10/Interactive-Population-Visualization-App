// Initialize map
const map = L.map('map').setView([20, 0], 2);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let worldGeoJsonLayer;
let worldData = {};
let totalPopulation = 0;
let indiaStatesData = [];

// Fetch and display world population data
async function loadWorldPopulation() {
    const response = await fetch('https://raw.githubusercontent.com/datasets/population/master/data/population.csv');
    const text = await response.text();
    const rows = text.split("\n").slice(1);

    rows.forEach(row => {
        const cols = row.split(",");
        const country = cols[0];
        const year = cols[2];
        const population = parseInt(cols[3]) || 0;

        if (year === "2020") {
            worldData[country] = population;
            totalPopulation += population;
        }
    });

    document.getElementById("populationHeader").innerHTML = `World Population: ${totalPopulation.toLocaleString()}`;

    const geoRes = await fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
    const geoData = await geoRes.json();

    worldGeoJsonLayer = L.geoJson(geoData, {
        style: feature => {
            const pop = worldData[feature.properties.name] || 0;
            return {
                fillColor: getColor(pop),
                weight: 1,
                opacity: 1,
                color: 'white',
                fillOpacity: 0.7
            };
        },
        onEachFeature: (feature, layer) => {
            const countryName = feature.properties.name;
            const population = worldData[countryName] || "Unknown";

            layer.bindPopup(`<b>${countryName}</b><br>Population: ${population.toLocaleString()}`);

            layer.on("click", () => {
                filterByCountry(countryName);
                map.fitBounds(layer.getBounds());
            });
        }
    }).addTo(map);

    populateCountryDropdown(geoData.features);
}

// Function to get color based on population
function getColor(pop) {
    return pop > 500000000 ? '#800026' :
           pop > 200000000 ? '#BD0026' :
           pop > 100000000 ? '#E31A1C' :
           pop > 50000000  ? '#FC4E2A' :
           pop > 20000000  ? '#FD8D3C' :
           pop > 10000000  ? '#FEB24C' :
                             '#FFEDA0';
}

// Populate country dropdown
function populateCountryDropdown(countries) {
    const countrySelect = document.getElementById("countrySelect");
    countries.forEach(feature => {
        let option = document.createElement("option");
        option.value = feature.properties.name;
        option.textContent = feature.properties.name;
        countrySelect.appendChild(option);
    });

    countrySelect.addEventListener("change", function() {
        filterByCountry(this.value);
    });
}

// Filter and display selected country
function filterByCountry(selectedCountry) {
    if (selectedCountry === "all") {
        map.setView([20, 0], 2);
        worldGeoJsonLayer.addTo(map);
        document.getElementById("populationHeader").innerHTML = `World Population: ${totalPopulation.toLocaleString()}`;
        document.getElementById("stateSelect").style.display = "none";
        return;
    }

    map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) {
            map.removeLayer(layer);
        }
    });

    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(res => res.json())
        .then(data => {
            let countryLayer = L.geoJson(data, {
                filter: feature => feature.properties.name === selectedCountry,
                style: {
                    fillColor: "#FF5733",
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                },
                onEachFeature: (feature, layer) => {
                    const countryName = feature.properties.name;
                    const population = worldData[countryName] || "Unknown";

                    layer.bindPopup(`<b>${countryName}</b><br>Population: ${population.toLocaleString()}`).openPopup();

                    layer.on("click", () => {
                        map.fitBounds(layer.getBounds());
                        updatePopulationHeader(countryName, population);
                    });
                }
            }).addTo(map);

            map.fitBounds(countryLayer.getBounds());

            const population = worldData[selectedCountry] || "Unknown";
            updatePopulationHeader(selectedCountry, population);
            
            if (selectedCountry === "India") {
                loadStates();
            } else {
                document.getElementById("stateSelect").style.display = "none";
            }
        });
}

// Update header with selected country population
function updatePopulationHeader(country, population) {
    document.getElementById("populationHeader").innerHTML = 
        `${country} Population: ${population.toLocaleString()}`;
}

// Load India's states when selecting "India"
async function loadStates() {
    try {
        const response = await fetch("https://api.npoint.io/4e3d5eb9635b6c182951"); // ✅ New API for India States
        const statesData = await response.json();

        if (!statesData || statesData.length === 0) {
            console.error("No state data available.");
            return;
        }

        indiaStatesData = statesData;
        const stateSelect = document.getElementById("stateSelect");
        stateSelect.innerHTML = `<option value="all">All States</option>`; 

        statesData.forEach(state => {
            let option = document.createElement("option");
            option.value = state.name;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });

        // Show the state dropdown
        stateSelect.style.display = "block"; 
        stateSelect.addEventListener("change", function() {
            filterByState(this.value);
        });

    } catch (error) {
        console.error("Error fetching state data:", error);
    }
}

// Filter and display state data
function filterByState(selectedState) {
    if (selectedState === "all") {
        document.getElementById("populationHeader").innerHTML = `India Population: 1,400,000,000`;
        return;
    }

    const stateInfo = indiaStatesData.find(state => state.name === selectedState);
    if (!stateInfo) return;

    document.getElementById("populationHeader").innerHTML = `${selectedState} Population: ${stateInfo.population.toLocaleString()}`;
}

// Load world population data on page load
loadWorldPopulation();
