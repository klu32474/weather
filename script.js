const weatherApi = {
    key: '4eb3703790b356562054106543b748b2',
    baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
    forecastBaseUrl: 'https://api.openweathermap.org/data/2.5/onecall',
}

let searchInputBox = document.getElementById('input-box');
let searchButton = document.getElementById('search-button');

// Search when Enter key is pressed or Search button is clicked
searchInputBox.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        getWeatherReport(searchInputBox.value);
    }
});

searchButton.addEventListener('click', () => {
    getWeatherReport(searchInputBox.value);
});

function getWeatherReport(city) {
    fetch(`${weatherApi.baseUrl}?q=${city}&appid=${weatherApi.key}&units=metric`)
        .then(weather => {
            if (!weather.ok) {
                throw new Error('City not found');
            }
            return weather.json();
        })
        .then(weather => {
            showWeatherReport(weather);
            let { lat, lon } = weather.coord;
            fetchForecast(lat, lon);
        })
        .catch(error => {
            swal("Error", error.message, "error");
        });
}

function showWeatherReport(weather) {
    let op = document.getElementById('weather-body');
    op.style.display = 'block';
    let todayDate = new Date();
    let parent = document.getElementById('parent');
    let weather_body = document.getElementById('weather-body');
    
    weather_body.innerHTML =
        `
    <div class="location-deatils">
        <div class="city" id="city">${weather.name}, ${weather.sys.country}</div>
        <div class="date" id="date"> ${dateManage(todayDate)}</div>
    </div>
    <div class="weather-status">
        <div class="temp" id="temp">${Math.round(weather.main.temp)}&deg;C </div>
        <div class="weather" id="weather"> ${weather.weather[0].main} <i class="${getIconClass(weather.weather[0].main)}"></i>  </div>
        <div class="min-max" id="min-max">${Math.floor(weather.main.temp_min)}&deg;C (min) / ${Math.ceil(weather.main.temp_max)}&deg;C (max) </div>
        <div id="updated_on">Updated as of ${getTime(todayDate)}</div>
    </div>
    <hr>
    <div class="day-details">
        <div class="basic">Feels like ${weather.main.feels_like}&deg;C | Humidity ${weather.main.humidity}%  <br> Pressure ${weather.main.pressure} mb | Wind ${weather.wind.speed} KMPH</div>
    </div>
    <div id="forecast">
        <!-- Forecast will be dynamically inserted here -->
    </div>
    `;
    parent.append(weather_body);
    changeBg(weather.weather[0].main);
    reset();
}

function fetchForecast(lat, lon) {
    // Fetch 7-day forecast
    fetch(`${weatherApi.forecastBaseUrl}?lat=${lat}&lon=${lon}&exclude=hourly,minutely&appid=${weatherApi.key}&units=metric`)
        .then(response => response.json())
        .then(data => {
            let currentDate = new Date();
            let dates = [];
            for (let i = -3; i < 4; i++) {
                let newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() + i);
                dates.push(newDate);
            }
            showForecast(data, dates);
        });
}

function showForecast(data, dates) {
    let forecastContainer = document.getElementById('forecast');
    let forecastHTML = '<h2>Weather Forecast</h2><table><thead><tr><th>Date</th><th>Temperature</th><th>Weather</th></tr></thead><tbody>';

    // Iterate through the dates and find the corresponding data
    dates.forEach(date => {
        let day = data.daily.find(day => new Date(day.dt * 1000).toDateString() === date.toDateString());
        if (day) {
            forecastHTML += `
            <tr class="forecast-row">
                <td>${dateManage(date)}</td>
                <td>${Math.round(day.temp.day)}&deg;C</td>
                <td>${day.weather[0].main} <i class="${getIconClass(day.weather[0].main)}"></i></td>
            </tr>
            `;
        }
    });

    forecastHTML += '</tbody></table>';
    forecastContainer.innerHTML = forecastHTML;
    applyAnimations();
}

function getTime(todayDate) {
    let hour = addZero(todayDate.getHours());
    let minute = addZero(todayDate.getMinutes());
    return `${hour}:${minute}`;
}

function dateManage(dateArg) {
    let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let year = dateArg.getFullYear();
    let month = months[dateArg.getMonth()];
    let date = dateArg.getDate();
    let day = days[dateArg.getDay()];
    return `${date} ${month} (${day}) , ${year}`
}

function changeBg(status) {
    let body = document.body;
    if (status === 'Clouds') {
        body.style.backgroundImage = 'url(img/clouds.jpg)';
    } else if (status === 'Rain') {
        body.style.backgroundImage = 'url(img/rainy.jpg)';
    } else if (status === 'Clear') {
        body.style.backgroundImage = 'url(img/clear.jpg)';
    } else if (status === 'Snow') {
        body.style.backgroundImage = 'url(img/snow.jpg)';
    } else if (status === 'Sunny') {
        body.style.backgroundImage = 'url(img/sunny.jpg)';
    } else if (status === 'Thunderstorm') {
        body.style.backgroundImage = 'url(img/thunderstrom.jpg)';
    } else if (status === 'Drizzle') {
        body.style.backgroundImage = 'url(img/drizzle.jpg)';
    } else if (status === 'Mist' || status === 'Haze' || status === 'Fog') {
        body.style.backgroundImage = 'url(img/mist.jpg)';
    } else {
        body.style.backgroundImage = 'url(img/bg.jpg)';
    }
}

function getIconClass(weatherType) {
    switch (weatherType) {
        case 'Rain':
            return 'fas fa-cloud-showers-heavy';
        case 'Clouds':
            return 'fas fa-cloud';
        case 'Clear':
            return 'fas fa-cloud-sun';
        case 'Snow':
            return 'fas fa-snowman';
        case 'Sunny':
            return 'fas fa-sun';
        case 'Mist':
            return 'fas fa-smog';
        case 'Thunderstorm':
        case 'Drizzle':
            return 'fas fa-thunderstorm';
        default:
            return 'fas fa-cloud-sun';
    }
}

function reset() {
    let input = document.getElementById('input-box');
    input.value = "";
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function applyAnimations() {
    const rows = document.querySelectorAll('.forecast-row');
    rows.forEach((row, index) => {
        row.style.animation = `fadeIn 0.5s ease-in-out ${index * 0.1}s forwards`;
    });
}
