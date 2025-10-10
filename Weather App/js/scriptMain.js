// define API link
const API_KEY = '89ffa055a75b47868ca190752243011'; // free API key from WeatherApi, expired by Dec 10th, 2024
const BASE_URL = 'https://api.weatherapi.com/v1/forecast.json';// api basic url
// read from weather.json, which is a json file that contains 
//common-seen weather conditions and corresponding images
const weatherConditions = JSON.parse(content);

//when the page is loading
window.onload = () => {
    // ask the users for location autherization when loading the main page
    if (navigator.geolocation) {
        //if get autherization
        navigator.geolocation.getCurrentPosition(locatedSucc, locatedErr);
    } else {
        //if user/browser refuse to offer autherization, use default setting Vancouver
        alert('Fail in getting autherization. Using default city.');
        fetchWeatherDataByCity('Vancouver');
    }
};

// create click event for button, when user click,
// check if <input type="text" id="city-input" placeholder="Enter city name"> is empty
// fetch weather dataset if not
// otherwise ask for an input
document.getElementById('city-input-btn').addEventListener('click', () => {
    const cityInput = document.getElementById('city-input').value.trim();
    if (!cityInput) {
        alert("Please enter a city name.");
        return;
    }
    fetchWeatherDataByCity(cityInput); 
});

//event for history weather link click
//pass current city data from mainPage to historyPage
document.addEventListener('DOMContentLoaded', () => {
    const historyLink = document.getElementById('history-link');
    if (historyLink) {
        historyLink.addEventListener('click', () => {
            const city = document.getElementById('city').textContent.trim();
            const historyUrl = `historyPage.html?city=${encodeURIComponent(city)}`;
            window.location.href = historyUrl;
        });
    }
});

// To show today's date of current location or searched city
function displayCurrentDate(cityTime) {
    const dateElement = document.getElementById('today');
    const currentDate = new Date(cityTime);

    // date format
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = currentDate.toLocaleDateString('en-US', options);

    // add text to element with id = "today"
    dateElement.textContent = formattedDate;
}

// get autherization and successfully get location data
function locatedSucc(position) {
    const { latitude, longitude } = position.coords;
    fetchWeatherDataByCoor(latitude, longitude);//use coordinates to fetch weather data from api
}

// get autherization but run into error in getting location data
function locatedErr(error) {
    console.error('Error in fetching geolocation:', error);
    alert('Unable to fetch location. Using default city: Vancouver.');
    fetchWeatherDataByCity('Vancouver'); // use default city Vancouver
}

// use coordinates to fetch weather dataset from api
function fetchWeatherDataByCoor(lat, lon) {
    //use api key to get dataset of the forecasted 7 days
    const dataset = `${BASE_URL}?key=${API_KEY}&q=${lat},${lon}&days=7&aqi=no&alerts=no`;
    fetchWeather(dataset);
}

// use city name to fetch weather dataset
function fetchWeatherDataByCity(city) {
    //use api key to get dataset of the forecasted 7 days
    const dataset = `${BASE_URL}?key=${API_KEY}&q=${city}&days=7&aqi=no&alerts=no`;
    fetchWeather(dataset);
}


// get any needed details of weather from dataset
function fetchWeather(dataset) {
    fetch(dataset)//use fetch to request data without blocking the main thread
        .then(response => {
            if (!response.ok) {
                throw new Error('Response failed, status code: ' + response.status);
            }
            return response.json(); // convert the dataset into JSON
        })
        .then(data => {
            // seperate specific parts from data
            const { location, current, forecast} = data;

            // show today's date in header
            displayCurrentDate(location.localtime);

            // update the background image of header, based on whether it's day or night
            updateHeaderBackground(current.is_day);

            // update the background image of main, based on current weather
            updateMainBackground(current.condition.text);

            // show the city name in header
            let locationHTML = `<h2>${location.name}</h2>`;
            document.getElementById('city').innerHTML = locationHTML;


            // get the forcasted weather of following 24 hours from now
            // and write them into <div class="hourly-info" id="hourly">
            const hourlyData = forecast.forecastday[0].hour;
            const currentTime = new Date(location.localtime).getHours();
            generate24HourForecast(hourlyData, currentTime, forecast.forecastday[1]);

            // get the forcasted weather of following 7 days from today
            // and write them into <div class="weekly-info" id="daily">
            generate7DayForecast(forecast.forecastday);

            // update Temprature card
            updateTemprature(current);

            // update CloudCover card
            updateCloudCover(current);

            // update Precipitation card
            updatePrecipitation(current);

            // update Tind card
            updateWind(current);

            // update UV card
            updateUV(current) ;

            // update DayCycle card
            updateDayCycle(forecast.forecastday[0].astro);

            // update MoonPhase card
            updateMoonPhase(forecast.forecastday[0].astro);

            // update Humidity card
            updateHumidity(current);

            // update Visibility card
            updateVisibility(current);

            // update Pressure card
            updatePressure(current);            
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            document.getElementById('hourly').textContent = 'Fail in loading weather data, please try again later.';
        });
}

//update background image of header & main

// update the background image of header based on day or night
function updateHeaderBackground(isDay) {
    const header = document.getElementById('header-background');
    if (isDay) {
        header.style.backgroundImage = "url('./image/day.jpg')"; // day
    } else {
        header.style.backgroundImage = "url('./image/night.jpg')"; // night
    }
}

// update the background image of main based on weather
function updateMainBackground(weatherCondition) {
    const main = document.getElementById('main-background');
    const imgUrl = findWeatherImage(weatherCondition); // get image url
    main.style.backgroundImage = `url(${imgUrl})`;// edit html
}

// get image path based on weather condition
function findWeatherImage(condition) {
    const normalizedCondition = condition.toLowerCase(); // all lower case, avoid case-sensitive
    for (const category of weatherConditions) {
        if (category.conditions.some(c => c.toLowerCase() === normalizedCondition)) {
            return category.image; 
        }
    }

    // if the condition does not match with the common-seen ones,
    //use default image
    return weatherConditions.find(category => category.category === "default").image;
}

//generate forcast of future hours and days

// get the forcasted weather of following 24 hours from now
// and write them into <div class="hourly-info" id="hourly">
function generate24HourForecast(hourlyData, currentTime, forecastNextDay) {
    //get hours start from now and later
    const filteredHourlyData = hourlyData.filter(hour => {
        const hourTime = new Date(hour.time).getHours();
        return hourTime >= currentTime;
    });
  
    //get more hours from the next day, 24 hours forcasting in total
    if (filteredHourlyData.length < 24 && forecastNextDay) {
        const remainingHours = 24 - filteredHourlyData.length;
        const nextDayHours = forecastNextDay.hour.slice(0, remainingHours);
        filteredHourlyData.push(...nextDayHours);
    }
    // initialize html
    let weatherHTML = ``;
    let isTomorrow = false;
    filteredHourlyData.forEach(hour => {
        const hourDate = new Date(hour.time);
        const hourOnly = hourDate.getHours(); // only need hour time when display hourly forecasting
        const formattedHour = `${hourOnly % 12 || 12} ${hourOnly >= 12 ? 'PM' : 'AM'}`;//convert hour number to time format
    
        // check if the hour gets to the next day
        if (!isTomorrow && hourDate.getDate() > new Date().getDate()) {
            weatherHTML += `<div class="hour-block tomorrow-indicator"><strong>Next Day</strong></div>`;
            isTomorrow = true;
        }
        // one hour-block, 
        //contain time, temperature, weather condition and an icon of weather
        weatherHTML += `
            <div class="hour-block">
                <p>${formattedHour}</p>
                <p>${hour.temp_c}°C</p>
                <p>${hour.condition.text}</p>
                <img src="https:${hour.condition.icon}" alt="hour-icon">
            </div>
        `;
    });
  
    weatherHTML += `</div>`;
    document.getElementById('hourly').innerHTML = weatherHTML;//edit html
}

// get the forcasted weather of following 7 days from today
// and write them into <div class="weekly-info" id="daily">
function generate7DayForecast(dailyData) {
    // initialize html
    let dailyHTML = `<h2>7-Day Forecast</h2>`;
    dailyData.forEach(day => {
        // one week-row, 
        //contain date, max temperature, min temperature, weather condition and an icon of weather
        dailyHTML += `
            <div class="week-row">
                <p>${day.date}</p>
                <p>${day.day.maxtemp_c}°C</p>
                <p>${day.day.mintemp_c}°C</p>
                <p id="condition-text">${day.day.condition.text}</p>
                <img src="https:${day.day.condition.icon}" alt="daily-icon">
            </div>
        `;
    });
    // edit html
    document.getElementById('daily').innerHTML = dailyHTML;
}

// update all cards

// update Temprature card
function updateTemprature(current){
    // where in html to edit
    const tempValueElement = document.querySelector('.temp-value');
    const tempDetailsElement = document.querySelector('.temp-details');

    // get new temperature in C
    tempValueElement.textContent = `${current.temp_c}°`;

    // some more details
    const feelsLike = `<p><i class="fas fa-person"></i> Feels like: ${current.feelslike_c}°</p>`;
    const comfortLevel = `<p><i class="fas fa-check"></i> ${current.condition.text}</p>`;

    tempDetailsElement.innerHTML = feelsLike + comfortLevel;
}



// update CloudCover card
function updateCloudCover(current) {
    // where in html to edit
    const cloudElement = document.querySelector('.cloud-widget');
    // update cloud cover percentage
    cloudElement.innerHTML=`
        <svg viewBox="0 0 100 100" class="circle-progress">
            <circle cx="50" cy="50" r="45" fill="none" class="bg" />
            <circle cx="50" cy="50" r="45" fill="none" class="progress" stroke-dasharray="${current.cloud}" />
        </svg>
        <span class="percentage">${current.cloud}%</span>`;
    //cloudPercentageElement.textContent = `${current.cloud}%`;
    

}

// update Precipitation card
function updatePrecipitation(current) {
    // where in html to edit
    const precipitationAmount = document.querySelector('.precipitation');
    // update amount of precipitation
    precipitationAmount.innerHTML = `
        <p>${current.precip_mm} mm</p>
        <p>${current.precip_in} inches precipitation within 24 hours.</p>`;


}

//update Wind card
function updateWind(current) {
    // where in html to edit
    const windSpeed = document.querySelector('.wind');
    // update wind speed & wind gust
    windSpeed.innerHTML = `
        <p>From ${current.wind_dir} (${current.wind_degree}°)</p>
        <p>${current.wind_kph} km/h Wind Speed</p>
        <p>${current.gust_kph} km/h Wind Gust</p>`;
        
}

//update UV card
function updateUV(current) {
    // where in html to edit
    const uv = document.querySelector('.uv');
    // update UV
    uv.innerHTML = `<p>${current.uv} (Moderate)</p> `;

    // visualize UV Indicator
    visualizeUVIndicator(current.uv);                
}

// update DayCycle card
function updateDayCycle(astro) {
    // where in html to edit
    const dayCycle = document.querySelector('.day-cycle');
    const sunDetails = document.querySelector('.sun-details');
    // update sunrise & sunset
    dayCycle.innerHTML = `
        <svg viewBox="0 0 100 50" class="cycle-progress">
            <path d="M0,50 A50,50 0 0,1 100,50" class="cycle-path"/>
            <circle cx="75" cy="50" r="3" class="sun-position"/>
        </svg>
        <div class="time-labels">
            <span>${astro.sunrise}</span>
            <span>${astro.sunset}</span>
        </div>
    `;
    sunDetails.innerHTML = `
        <p><i class="fas fa-sunrise"></i> Sunrise: ${astro.sunrise}</p>
        <p><i class="fas fa-sunset"></i> Sunset: ${astro.sunset}</p>
    `;
}

// update MoonPhase card
function updateMoonPhase(astro) {
    // where in html to edit
    const moonPhase = document.querySelector('.moon-phase');
    const moonDetails = document.querySelector('.moon-details');
    // update moon phase
    moonPhase.innerHTML = `
        <svg viewBox="0 0 100 100" class="moon-circle">
            <circle cx="50" cy="50" r="45" class="moon-bg"/>
            <path class="moon-fill" d="M50,5 A45,45 0 1,1 50,95 A35,35 0 1,0 50,5"/>
        </svg>
        <span class="phase-percentage">${astro.moon_phase}</span>
                        
    `;
    moonDetails.innerHTML = `
        <p><i class="fas fa-arrow-up"></i> Moonrise: ${astro.moonrise}</p>
        <p><i class="fas fa-arrow-down"></i> Moonset: ${astro.moonset}</p>
        <p><i class="fas fa-moon"></i> Phase of moon: ${astro.moon_phase}</p>
        <p><i class="fas fa-calendar"></i> Moon illumination: ${astro.moon_illumination}</p>
    `;
}

// update Humidity card
function updateHumidity(current) {
    // where in html to edit
    const humidity = document.getElementById('humidity');
    // update humidity percentage
    humidity.innerHTML = `
        <div class="humidity-gauge">
            <svg viewBox="0 0 100 100" class="circle-progress">
                <circle cx="50" cy="50" r="45" fill="none" class="bg"/>
                <circle cx="50" cy="50" r="45" fill="none" class="progress" stroke-dasharray="${current.humidity}"/>
            </svg>
            <span class="percentage">${current.humidity}%</span>
        </div>
        <p>62% Relative Humidity</p> 
        <p>${current.dewpoint_c}° Dew point</p>
    `;
}

//update Visibility card
function updateVisibility(current) {
    // where in html to edit
    const visibility = document.getElementById('visibility');
    // update visibility
    visibility.innerHTML = `
        <div class="visibility-meter">
            <div class="meter-scale">
                <div class="meter-indicator"></div>
            </div>
            <div class="meter-labels">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20km</span>
            </div>
        </div>
        <p><i class="fas fa-binoculars"></i> Clear visibility: ${current.vis_km}km</p>
    `;
    // visualize Visibility Meter
    visualizeVisibilityMeter(current.vis_km);
                       
}

//update Pressure card
function updatePressure(current) {
    // where in html to edit
    const pressure = document.getElementById('pressure');
    // update preassure value
    pressure.innerHTML = `
        <div class="pressure-gauge">
            <div class="gauge-dial">
                <div class="gauge-pointer"></div>
            </div>
            <div class="pressure-value">${current.pressure_mb} hPa</div>
        </div>
        <p>${current.pressure_mb}  mb</p> 
        <p>${current.pressure_in}  in</p>
    `;
    // visualize Pressure Gauge
    visualizePressureGauge(current.pressure_mb);
}

// Visualize the uv, visibility & pressure

// update UV Indicator
function visualizeUVIndicator(uvIndex) {
    const uvIndicator = document.querySelector('.uv-indicator');
    //limit the uv number between 0 ~ 11
    //set to 0 if it is less than 0 (not possible in real life but just in case)
    //set to 11 if it is greater than 11
    const uvLevel = Math.min(Math.max(uvIndex, 0), 11); 
    const position = (uvLevel / 11) * 100; // calculate percentage
    uvIndicator.style.left = `${position}%`; // adjust the indicator
}

// update Visibility Meter
function visualizeVisibilityMeter(visibility) {
    const visibilityIndicator = document.querySelector('.meter-indicator');
    const maxVisibility = 20; // assume the maximum vis is 20
    //if the actual visibility is more than maxVisibility, see it equally as maxVisibility
    //then calculate the lenth of white bar
    const widthPercentage = Math.min((visibility / maxVisibility) * 100, 100);
    visibilityIndicator.style.width = `${widthPercentage}%`; // adjust the indicator
}

// update Pressure Gauge
function visualizePressureGauge(pressure) {
    const pressurePointer = document.querySelector('.gauge-pointer');
    const minPressure = 950; // assume lowest pressure
    const maxPressure = 1050; // assume highest pressure
    // if the actual pressure number go above max, make it = max
    // if the actual pressure number go below min, make it = min
    const pressureValue = Math.min(Math.max(pressure, minPressure), maxPressure);
    // then calculate the angle of gauge pointer
    const rotation = ((pressureValue - minPressure) / (maxPressure - minPressure)) * 180 - 90;
    pressurePointer.style.transform = `rotate(${rotation}deg)`;//adjust the gauge
}





