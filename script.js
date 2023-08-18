// Global variable of maplist


var mapList;
const paragraph = "ON has an excellent anti-SLAPP law that ranks the highest in the world in our scoring(in a tie with British Columbia). It is broad in scope and has strong procedures that imposea low bar on a defendant to bring an anti-SLAPP motion, and protections if a defendant’s motion is denied.";
var obj;

function loadMap() {
  var map = document.getElementById("map").contentDocument.querySelector("svg");
  var toolTip = document.getElementById("toolTip");
  var modal = document.getElementById("myModal");

  // Add event listeners to map element
  if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // If user agent is not mobile add click listener (for wikidata links)
    map.addEventListener("click", handleClick, false);
  }
  map.addEventListener("mousemove", mouseEntered, false);
  map.addEventListener("mouseout", mouseGone, false);

  // Show tooltip on mousemove
  function mouseEntered(e) {
    var target = e.target;
    if (target.nodeName == "path") {
      target.style.opacity = 0.6;
      var details = e.target.attributes;

      // Follow cursor
      toolTip.style.transform = `translate(${e.offsetX}px, ${e.offsetY}px)`;

      // Tooltip data
      toolTip.innerHTML = `
        <ul>
            <li><b>Province: ${details.name.value}</b></li>
            <li>Local name: ${details.gn_name.value}</li>
            <li>Country: ${details.admin.value}</li>
            <li>Postal: ${details.postal.value}</li>
        </ul>`;
    }
  }

  // Clear tooltip on mouseout
  function mouseGone(e) {
    var target = e.target;
    if (target.nodeName == "path") {
      target.style.opacity = 1;
      toolTip.innerHTML = "";
    }
  }

  // Go to wikidata page onclick
  function handleClick(e) {
    if (e.target.nodeName == "path") {
      var details = e.target.attributes;
      //console.log(e.target.nodeName);
      getLocal();

      // console.log(obj[2]);
      //matching selected province with json data
      const prov = details.postal.value;
      var res = null;

      for(let i = 0; i < obj.length; i++){
        if(prov == obj[i].province){
          res = obj[i];
          break;
        }
      }

      // console.log(res);
      
      // console.log("im here");
      modal.style.display = "block";
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close">&times;</span>
          <h4><b>${e.target.attributes.name.value}</b></h4>
          <p>${paragraph}</p>
          <button class="link">Read More</button>
        </div>
        <div class="box1">
          <p>SCORE</p> <p><b>${res.score}</b></p>
        </div>
        <div class = "box2">
          <p>GRADE</p> <p><b>${res.grade}</b></p>
        </div>
        `;

      //button for read more to open url
      btn = document.getElementsByClassName("link")[0];
      btn.onclick = function(){
        window.open(`https://www.wikidata.org/wiki/${details.wikidataid.value}`, "_blank");
      }

      //close button
      span = document.getElementsByClassName("close")[0];
      span.onclick = function() {
        modal.style.display = "none";
      }

    }
  }
}

// Calls init function on window load
window.onload = function () {
  var changeSelector = document.getElementById("mapChange");

  // Get JSON file containing map list
  getData("mapList.json").then(function (res) {
    mapList = res;
    res.map(function (item) {
      var option = document.createElement("option");
      option.text = item[0] + " - " + item[1];
      option.value = item[3];
      changeSelector.appendChild(option);
    });
    changeSelector.options[149].selected = "selected";
  });

  // Init map
  loadMap();
};


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

//getting local data 
function getLocal(){
  fetch('./localdata.json')
  .then((response) => response.json())
  .then((data) => {obj = data})
}