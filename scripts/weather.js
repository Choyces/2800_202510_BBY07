function fetchLocation() {
    const city = document.getElementById("cityInput").value;
    const apiKey = "514d09dd252b3c311dddd8255d3ed814";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const { lon, lat } = data.coord;
            document.getElementById("location").innerHTML = `
                <p>City: ${city}</p>
                <p>Longitude: ${lon}</p>
                <p>Latitude: ${lat}</p>
            `;
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            document.getElementById("location").innerHTML = `<p style="color: red;">City not found or network error.</p>`;
        });
}
