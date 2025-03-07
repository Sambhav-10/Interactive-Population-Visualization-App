async  function loadStates(country) {
    // document.getElementById("stateSelect").innerHTML = "<option value='all'>Loading...</option>";

    // Fetch states from Geonames API
    const response = await fetch(`http://api.geonames.org/searchJSON?country=${country}&featureClass=A&maxRows=50&username=demo`);
    const data = await response.json();
    console.log(data);
    
}
    // let options = "<option value='all'>Select State</option>";
    // data.geonames.forEach(state => {
    //     options += `<option value="${state.adminName1}">${state.adminName1}</option>`;
    // });

    // document.getElementById("stateSelect").innerHTML = options;
    loadStates("IN");