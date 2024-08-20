const weatherApi = {
    key: '4eb3703790b356562054106543b748b2',
    baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
    forecastBaseUrl: 'https://api.openweathermap.org/data/2.5/onecall',
    hourlyBaseUrl: 'https://api.openweathermap.org/data/2.5/forecast'
}

let searchInputBox = document.getElementById('input-box');
let searchButton = document.getElementById('search-button');
let locationButton = document.getElementById('location-button');
let unitToggle = document.getElementById('unit-toggle');
let addFavoriteButton = document.getElementById('add-favorite');
let isCelsius = true;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

// Search when Enter key is pressed or Search button is clicked
searchInputBox.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        getWeatherReport(searchInputBox.value);
    }
});

searchButton.addEventListener('click', () => {
    getWeatherReport(searchInputBox.value);
});

locationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            let { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        });
    } else {
        swal("Error", "Geolocation is not supported by this browser.", "error");
    }
});

unitToggle.addEventListener('click', () => {
    isCelsius = !isCelsius;
    unitToggle.textContent = isCelsius ? 'Switch to Fahrenheit' : 'Switch to Celsius';
    updateWeatherDisplay();
});

addFavoriteButton.addEventListener('click', () => {
    let city = searchInputBox.value.trim();
    if (city && !favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        displayFavorites();
    }
});

function getWeatherReport(city) {
    if (!city) return;

    fetch(`${weatherApi.baseUrl}?q=${city}&appid=${weatherApi.key}&units=${isCelsius ? 'metric' : 'imperial'}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('City not found');
            }
            return response.json();
        })
        .then(weather => {
            showWeatherReport(weather);
            let { lat, lon } = weather.coord;
            fetchForecast(lat, lon);
            fetchHourlyForecast(lat, lon);
            updateSearchHistory(city);
        })
        .catch(error => {
            swal("Error", error.message, "error");
        });
}

function fetchWeatherByCoords(lat, lon) {
    fetch(`${weatherApi.baseUrl}?lat=${lat}&lon=${lon}&appid=${weatherApi.key}&units=${isCelsius ? 'metric' : 'imperial'}`)
        .then(response => response.json())
        .then(weather => {
            showWeatherReport(weather);
            fetchForecast(lat, lon);
            fetchHourlyForecast(lat, lon);
        })
        .catch(error => {
            swal("Error", error.message, "error");
        });
}

function showWeatherReport(weather) {
    let weatherBody = document.getElementById('weather-body');
    weatherBody.style.display = 'block';
    let todayDate = new Date();
    let parent = document.getElementById('parent');
    weatherBody.innerHTML = `
        <div class="location-deatils">
            <div class="city" id="city">${weather.name}, ${weather.sys.country}</div>
            <div class="date" id="date"> ${dateManage(todayDate)}</div>
        </div>
        <div class="weather-status">
            <div class="temp" id="temp">${Math.round(weather.main.temp)}&deg;${isCelsius ? 'C' : 'F'} </div>
            <div class="weather" id="weather"> ${weather.weather[0].main} <i class="${getIconClass(weather.weather[0].main)}"></i>  </div>
            <div class="min-max" id="min-max">${Math.floor(weather.main.temp_min)}&deg;${isCelsius ? 'C' : 'F'} (min) / ${Math.ceil(weather.main.temp_max)}&deg;${isCelsius ? 'C' : 'F'} (max) </div>
            <div id="updated_on">Updated as of ${getTime(todayDate)}</div>
        </div>
        <hr>
        <div class="day-details">
            <div class="basic">Feels like ${weather.main.feels_like}&deg;${isCelsius ? 'C' : 'F'} | Humidity ${weather.main.humidity}%  <br> Pressure ${weather.main.pressure} mb | Wind ${weather.wind.speed} KMPH</div>
        </div>
        <div id="hourly-forecast">
            <!-- Hourly forecast will be dynamically inserted here -->
        </div>
        <div id="forecast">
            <!-- Forecast will be dynamically inserted here -->
        </div>
    `;
    parent.append(weatherBody);
    changeBg(weather.weather[0].main);
    reset();
}

function fetchForecast(lat, lon) {
    fetch(`${weatherApi.forecastBaseUrl}?lat=${lat}&lon=${lon}&exclude=hourly,minutely&appid=${weatherApi.key}&units=${isCelsius ? 'metric' : 'imperial'}`)
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

function fetchHourlyForecast(lat, lon) {
    fetch(`${weatherApi.hourlyBaseUrl}?lat=${lat}&lon=${lon}&appid=${weatherApi.key}&units=${isCelsius ? 'metric' : 'imperial'}`)
        .then(response => response.json())
        .then(data => {
            showHourlyForecast(data);
        });
}

function showHourlyForecast(data) {
    let hourlyForecastContainer = document.getElementById('hourly-forecast');
    let hourlyForecastHTML = '<h2>Hourly Forecast</h2><table><thead><tr><th>Time</th><th>Temperature</th><th>Weather</th></tr></thead><tbody>';

    data.list.slice(0, 8).forEach(entry => {
        let date = new Date(entry.dt * 1000);
        hourlyForecastHTML += `
            <tr class="hourly-row">
                <td>${date.getHours()}:00</td>
                <td>${Math.round(entry.main.temp)}&deg;${isCelsius ? 'C' : 'F'}</td>
                <td>${entry.weather[0].main} <i class="${getIconClass(entry.weather[0].main)}"></i></td>
            </tr>
        `;
    });

    hourlyForecastHTML += '</tbody></table>';
    hourlyForecastContainer.innerHTML = hourlyForecastHTML;
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
                    <td>${Math.round(day.temp.day)}&deg;${isCelsius ? 'C' : 'F'}</td>
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
    return `${date} ${month} (${day}) , ${year}`;
}

function changeBg(status) {
    let body = document.body;
    if (status === 'Clouds') {
        body.style.backgroundImage = 'url(img/clouds.jpg)';
    } else if (status === 'Rain') {
        body.style.backgroundImage = 'url(img/rainy.jpg)';
    } else if (status === 'Clear') {
        body.style.backgroundImage = 'url(img/clear.jpg)';
    } else if (status === 'Thunderstorm') {
        body.style.backgroundImage = 'url(img/thunderstorm.jpg)';
    } else if (status === 'Snow') {
        body.style.backgroundImage = 'url(img/snowy.jpg)';
    } else {
        body.style.backgroundImage = 'url(img/default.jpg)';
    }
}

function getIconClass(weather) {
    switch (weather) {
        case 'Clear':
            return 'fas fa-sun';
        case 'Clouds':
            return 'fas fa-cloud';
        case 'Rain':
            return 'fas fa-cloud-showers-heavy';
        case 'Snow':
            return 'fas fa-snowflake';
        case 'Thunderstorm':
            return 'fas fa-bolt';
        default:
            return 'fas fa-question';
    }
}

function applyAnimations() {
    document.querySelectorAll('.forecast-row, .hourly-row').forEach(row => {
        row.classList.add('fadeIn');
    });
}

function addZero(num) {
    return num < 10 ? '0' + num : num;
}

function updateSearchHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.push(city);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        displaySearchHistory();
    }
}

function displaySearchHistory() {
    let searchHistoryContainer = document.getElementById('search-history');
    searchHistoryContainer.innerHTML = '<h2>Search History</h2><ul>';

    searchHistory.forEach(city => {
        searchHistoryContainer.innerHTML += `<li>${city}</li>`;
    });

    searchHistoryContainer.innerHTML += '</ul>';
}

function displayFavorites() {
    let favoritesContainer = document.getElementById('favorites');
    favoritesContainer.innerHTML = '<h2>Favorites</h2><ul>';

    favorites.forEach(city => {
        favoritesContainer.innerHTML += `<li>${city}</li>`;
    });

    favoritesContainer.innerHTML += '</ul>';
}

function reset() {
    addFavoriteButton.style.display = 'block';
    document.getElementById('download-button').style.display = 'block';
}

document.getElementById('download-button').addEventListener('click', () => {
    html2canvas(document.getElementById('parent')).then(canvas => {
        let link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'weather-report.png';
        link.click();
    });
});

// Initialize the app with search history and favorites
displaySearchHistory();
displayFavorites();
