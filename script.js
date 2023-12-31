// Global variable of maplist
let mapList;
let regionData;
let mapSettings;
let currentCountry;
let currentRegionsData;

function loadMap() {
  var map = document.getElementById("map").contentDocument.querySelector("svg");
  var toolTip = document.getElementById("toolTip");

  // Add event listeners to map element
  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // If user agent is not mobile add click listener (for wikidata links)
    map.addEventListener("click", handleClick, false);
  }
  map.addEventListener("mousemove", mouseEntered, false);
  map.addEventListener("mouseout", mouseGone, false);

  currentRegionsData.forEach((region) => {
    let path = map.querySelectorAll(`#${region.short_name}`);
    path.forEach((item) => {
      item.style.fill = `${region.colour}`;
    });
    
  });


  svgPanZoom('#map', {
    zoomEnabled: true,
    controlIconsEnabled: true
  });

  // Show tooltip on mousemove
  function mouseEntered(e) {
    var target = e.target;
    if (target.nodeName == "path") {
      target.style.opacity = 0.8;
      var details = e.target.attributes;

      // Follow cursor
      toolTip.style.transform = `translate(${e.offsetX}px, ${e.offsetY}px)`;

      toolTip.innerHTML = `
      <ul>
          <li><b>${details.title.value}</b></li>
      </ul>`;
    }
  }

  // Clear tooltip on mouseout
  function mouseGone(e) {
    let target = e.target;
    if (target.nodeName == "path") {
      target.style.opacity = 1;
      toolTip.innerHTML = "";
    }
  }

  // Go to wikidata page onclick
  function handleClick(e) {
    if (e.target.nodeName == "path") {
      let details = e.target.attributes;
      // window.open(`https://www.wikidata.org/wiki/${details.wikidataid.value}`, "_blank");

      loadPopup(details);

    }
  }  
}

// Calls init function on window load
window.onload = function () {
  const changeSelector = document.getElementById("mapChange");
  
  // Get URL parameters
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const mapNodeID = urlParams.get('id');

  if (mapNodeID == 'test') {
    console.error("[MAP] Error: No node id provided for map. Loading test data.");
    
    getData('./data/mapdata.json').then(function (res) {
      mapList = res;
    
      // create the option elements for the country selector
      mapList.forEach((item) => {
        let option = document.createElement('option');
        option.text = item.country_name;
        option.value = item.country_short_name;
        changeSelector.appendChild(option);
      });
      changeSelector.options[0].selected = "selected";
      changeMap();
    });
    getData('./data/regiondata.json').then(function (res) {
      regionData = res;
    });
  } else {
    getData(`/api/v1/map/${mapNodeID}`).then(function (res) {
      mapList = res;
      setMapSettings(mapList[0].map_display_settings);
      setMapTitle();

      // create the option elements for the country selector
      mapList.forEach( (item) => {
        let option = document.createElement('option');
        option.text = item.country_name;
        option.value = item.country_short_name;
        changeSelector.appendChild(option);
      });
      changeSelector.options[0].selected = "selected";
      changeMap();
    });
    getData(`/api/v1/mapdata/${mapNodeID}`).then(function (res) {
      regionData = res;
    });
  }
};

async function setMapSettings(mapData) {
  mapSettings = mapData.split(",");
}

async function setMapTitle() {
  const mapTitle = document.querySelector('#maptitle');
  mapTitle.innerHTML = `${mapList[0].map_title}`;
}

async function loadPopup(path, selectedValue, selectedText) {
  
  let filterData;
  let title;

  if (selectedValue && selectedText && path == 0) {
    filterData = regionData.filter((lookup) => {
      return lookup.short_name === selectedValue;
    });
    title = selectedText;
  } else {
    filterData = regionData.filter((lookup) => {
      return lookup.short_name === path.id.value;
    });
    title = path.title.value;
  }

  const selectedRegion = filterData[0];
    
  const regionDataRender = document.querySelector('#regionDataRender');
  const regionTitle = regionDataRender.querySelector('#regionTitle');
  const regionScore = regionDataRender.querySelector('#regionScore');
  const regionDescription = regionDataRender.querySelector('#regionDescription');

  regionTitle.innerHTML = null;
  regionScore.innerHTML = null;
  regionDescription.innerHTML = null;
  
  let score = 'N/A';
  let grade = 'N/A';
  let description = 'No data is available for this region.';
  let link = '#';

  if (filterData.length === 0) {
    console.warn('[Map] Error: Could not find popup data');  
  } else {
    
    title = selectedRegion.data_title;
    if (selectedRegion.total_score) {
      score = selectedRegion.total_score;
    }
    if (selectedRegion.grade) {
      grade = selectedRegion.grade;
    }
    if (selectedRegion.description) {
      description = selectedRegion.description;
    }
    if (selectedRegion.url_data) {
      link = selectedRegion.url_data;
    }
  }


  let scoreElement = `
    <div class="score-item">
      <h4>Score</h4>
      <p>${score}</p>
    </div>`;
  
  let gradeElement = `
    <div class="score-item">
      <h4>Grade</h4>
      <p>${grade}</p>
    </div>`;

  let titleElement = `<h2>${title}</h2>`;
  let descriptionElement = `<div class="description"><p>${description}</p></div>`;

  let linkElement = `<a href="${link}" target="_blank" title="Open data for ${title} in a separate window">Read More</a>`;
  
  regionScore.innerHTML = '';

  if (mapSettings.includes('displayScore')) {
    regionScore.innerHTML += scoreElement;
  }
  if (mapSettings.includes('displayGrade')) {
    regionScore.innerHTML += gradeElement;
  }

  regionTitle.innerHTML = titleElement;
  regionDescription.innerHTML += descriptionElement;
  
  if (link !== '#') {
    regionDescription.innerHTML += linkElement;
  }

  document.getElementById('regionDataRender').classList.add('open');

}

function createOptions() {
  const regionSelector = document.getElementById("regionSelect");

  regionSelector.innerHTML = `<option value="" disabled selected>Select</option>`;
  currentRegionsData = regionData.filter((region) => {
      return region.country_short_name === currentCountry;
    });
  currentRegionsData.forEach((region) => {
    let option = document.createElement('option');
    option.text = region.name;
    option.value = region.short_name;
    regionSelector.appendChild(option);
  });

}

async function regionSelect() {
  const map = document.getElementById("map");
  const regionSelector = document.getElementById("regionSelect");

  let selectedValue = regionSelector.options[regionSelector.selectedIndex].value;
  let selectedText = regionSelector.options[regionSelector.selectedIndex].text;

  loadPopup(0,selectedValue,selectedText);

}

// Calls map change function on button click
async function changeMap(random) {
  const map = document.getElementById("map");
  const changeSelector = document.getElementById("mapChange");

  // Get value of dropdown selection
  let selectedValue;

  

  if (random) {
    // Random map generated
    selectedValue = mapList[random][3];
    changeSelector.options[random].selected = "selected";
  } else {
    // Selected from dropdown
    selectedValue = changeSelector.options[changeSelector.selectedIndex].value;
  }

  currentCountry = selectedValue;

  // Load new map
  map.data = `maps/${selectedValue}.svg`;

  // Re-init map on map load
  
  map.onload = async () => {
    setTimeout(function() {
      createOptions();
      loadMap();
    },1000);
  };
}


async function getMapData() {
  try {
    const response = await fetch('./data/mapdata.json');
    const data = await response.json();
  } catch (error) {
    console.error(error);
  }
}

// Load external data
function getData(e) {
  var request = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    request.open("GET", e);

    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        resolve(JSON.parse(request.responseText));
      } else {
        console.error("Cant reach the file!");
      }
    };

    request.onerror = function () {
      console.error("Cant reach the file!");
    };

    request.send();
  });
}

function closePop() {
  document.getElementById('regionDataRender').classList.remove('open');
}

function toggleFullscreen(e) {
  var el = document.querySelector('body');
  if(document.fullscreenElement){ 
    document.exitFullscreen();
    changeMap();
  } else { 
    el.requestFullscreen();
    changeMap();
  } 
}