//fetch user current location and weather
function fetchLocation() {
    const apiKey = "514d09dd252b3c311dddd8255d3ed814";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            lat = position.coords.latitude
            lng = position.coords.longitude
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&exclude={part}&appid=${apiKey}`;
          fetch(url)
              .then(response => response.json())
              .then(data => {
                  console.log(data);
                  displayLocationData(data);
                  document.getElementById("location").innerHTML = `
                      <p>Longitude: ${lng}</p>
                      <p>Latitude: ${lat}</p>
                  `;
              })
              .catch(error => {
                  console.error("Error fetching data:", error);
                  document.getElementById("location").innerHTML = `<p style="color: red;">City not found or network error.</p>`;
              });
          },
          (error) => {
            console.warn("Geolocation error:", error);
          }
        );
      } else {
        console.error("Geolocation not supported.");
      }

}

function displayLocationData(data) {
    document.getElementById('weatherinfo').innerHTML = `
    <strong>weather info: </strong>${data.weather[0].description} <br>
    <strong>country:</strong> ${data.sys.country}  <br>
    <strong>city:</strong> ${data.name}  <br>
    <strong>temperature:</strong> ${data.main.temp} celsius <br>
    `;
}

window.onload = function() {
    fetchLocation();
}