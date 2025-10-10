const API_KEY = '89ffa055a75b47868ca190752243011'; // API Key
const BASE_URL = 'https://api.weatherapi.com/v1/history.json';

window.onload = () => {
    // default city
    const defaultCity = 'Vancouver';
    // get city from url
    const params = new URLSearchParams(window.location.search);
    // if there's existing city then use it, otherwise use default city
    const city = params.get('city') || defaultCity;

    // edit html to display city name <h1 id="city"></h1>
    document.getElementById('city').textContent = city;

    //update header's background image based on day or night
    fetchCurrentTime(city)

    //update the history weather of last 7 days
    fetchSevenDaysWeatherHistory(city);

     // search a city
     const searchButton = document.getElementById('city-input-btn');
     searchButton.addEventListener('click', handleCitySearch);
};

// get current time of the city, and update the header's background image
function fetchCurrentTime(city) {
    const dataset = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`;
    fetch(dataset)//use fetch to request data without blocking the main thread
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fail in fetching current weather for ${city}.`);
            }
            return response.json();//convert to json
        })
        .then(data => {
            const isDay = data.current.is_day; 
            updateHeaderBackground(isDay); 
        })
        .catch(error => {
            console.error('Error in fetching current time:', error);
        });
}

// update header's background image by whether it's daytime
function updateHeaderBackground(isDay) {
    const header = document.getElementById('header-background');
    if (isDay) {
        header.style.backgroundImage = "url('./image/day.jpg')"; // day image
    } else {
        header.style.backgroundImage = "url('./image/night.jpg')"; // night image
    }
}

// when user click on button
function handleCitySearch() {
    const cityInput = document.getElementById('city-input').value.trim();
    if (!cityInput) {
        alert("Please enter a city name.");//if the input is empty
        return;
    }
    // update the page using new city data
    document.getElementById('city').textContent = cityInput;
    fetchSevenDaysWeatherHistory(cityInput);
}

//get the forecasting weather data for the past 7 days
function fetchSevenDaysWeatherHistory(city) {
    const historyContainer = document.getElementById('history');//where to edit in html
    historyContainer.innerHTML = '<p>Loading history weather data...</p>';
    const promises = [];

    //update the city
    document.getElementById('city').innerHTML = `${city}`;

    //get the past 7 days data and stored in promises
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        const url = `${BASE_URL}?key=${API_KEY}&q=${city}&dt=${formattedDate}`;
        promises.push(fetch(url).then(res => res.json()));
    }

    //use Promise to go through data asynchronously, for multiple fetch requests
    //make sure every data is accessable then generate rows
    Promise.all(promises)
        .then(results => {
            const historyHTML = results.map(data => generateWeatherRow(data)).join('');
            historyContainer.innerHTML = `<div class="weekly-info">${historyHTML}</div>`;
        })
        .catch(error => {
            console.error('Error fetching history weather data:', error);
            historyContainer.textContent = 'Failed to load history data.';
        });
}

//generate one row of history weather
//include date, max temperature, in temperature, weather condition and an icon
function generateWeatherRow(data) {
    const { forecastday } = data.forecast;
    const day = forecastday[0].day;
    const date = forecastday[0].date;
    return `
        <div class="week-row">
            <p>${date}</p>
            <p>${day.maxtemp_c}°C</p>
            <p>${day.mintemp_c}°C</p>
            <p>${day.condition.text}</p>
            <img src="https:${day.condition.icon}" alt="weather-icon">
        </div>
    `;
}
