const locationSection = document.getElementById("location-data");
const weatherSection = document.getElementById("weather-data");
const localNewsSection = document.getElementById("local-news-data");
const nationalNewsSection = document.getElementById("national-news-data");

// Function to change time every second
function updateTime(timezone) {
  const timePara = document.getElementById("localTime");
  setInterval(() => {
    const localTime = new Date().toLocaleString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    timePara.innerHTML = `<img src="icons/clock.svg">Local Time: ${localTime}`;
  }, 1000);
}

// Fnction to map WMO weather code to their description
function mapWeatherCodeToDescription(code) {
  switch (code) {
    case 0:
      return "Clear Sky";
    case 1:
    case 2:
      return "Partly Cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Fog";
    case 51:
    case 53:
    case 61:
    case 63:
    case 65:
      return "Rain";
    case 71:
    case 73:
    case 75:
      return "Snow";
    case 80:
    case 81:
    case 82:
      return "Showers";
    case 95:
    case 96:
    case 99:
      return "Thunderstorm";
    default:
      return "Unknown Weather Condition";
  }
}

// Function to get the weather icon based on the codition
function getWeatherIcon(condition) {
  switch (condition.toLowerCase()) {
    case "clear sky":
      return '<img class="weatherIcon" src="icons/sun.svg" />';
    case "partly cloudy":
      return '<img class="weatherIcon" src="icons/cloudy.svg" />';
    case "fog":
      return '<img class="weatherIcon" src="icons/cloudFog.svg" />';
    case "rain":
      return '<img class="weatherIcon" src="icons/cloudRain.svg" />';
    case "snow":
      return '<img class="weatherIcon" src="icons/cloudSnow.svg" />';
    case "showers":
      return '<img class="weatherIcon" src="icons/cloudRain.svg" />';
    case "thunderstorm":
      return '<img class="weatherIcon" src="icons/cloudLightning.svg" />';
    default:
      return '<img class="weatherIcon" src="icons/cloud.svg" />';
  }
}

// Function to map Hourly Data
function mapcurrentTimeToHourlyData(data) {
  const currentTime = new Date(data.current_weather.time);
  const roundedTime = new Date(
    Date.UTC(
      currentTime.getUTCFullYear(),
      currentTime.getUTCMonth(),
      currentTime.getUTCDate(),
      currentTime.getUTCHours(),
      currentTime.getUTCMinutes() >= 30 ? 60 : 0
    )
  );
  const roundedHour = roundedTime.toISOString().slice(0, 16);
  const index = data.hourly.time.findIndex((time) =>
    time.startsWith(roundedHour)
  );
  return [
    index !== -1 ? data.hourly.apparent_temperature[index] : null,
    index !== -1 ? data.hourly.wind_speed_10m[index] : null,
    index !== -1 ? data.hourly.relative_humidity_2m[index] : null,
    index !== -1 ? data.hourly.surface_pressure[index] : null,
    index !== -1 ? data.hourly.precipitation_probability[index] : null,
    index !== -1 ? data.hourly.shortwave_radiation[index] : null,
    index !== -1 ? data.hourly.direct_normal_irradiance[index] : null,
    index !== -1 ? data.hourly.diffuse_radiation[index] : null,
  ];
}

// Function to convert Wind Direction from Degrees to Readable Format
function getWindDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Function to calculate UV Index from Solar Radiation
function calculateUVIndex(data) {
  const ghi = data[5];
  const dni = data[6];
  const dhi = data[7];
  const tsi = ghi + dni + dhi;
  const uvIndex = tsi * 0.005;
  return uvIndex.toFixed(2);
}

// Function to convert into readable time
function simpleTime(gmtString, currentOffset) {
  const date = new Date(gmtString);

  const utcTimeInMillis = date.getTime();

  const [sign, hours, minutes] = currentOffset
    .match(/([+-])(\d{1,2}):?(\d{0,2})/)
    .slice(1);

  const offsetHours = parseInt(hours, 10);
  const offsetMinutes = parseInt(minutes, 10) || 0;

  const totalOffsetInMillis = (offsetHours * 60 + offsetMinutes) * 60 * 1000;
  const adjustedOffsetInMillis =
    sign === "+" ? totalOffsetInMillis : -totalOffsetInMillis;

  const localTimeInMillis = utcTimeInMillis + adjustedOffsetInMillis;

  const localDate = new Date(localTimeInMillis);

  let hoursLocal = localDate.getHours();
  const minutesLocal = localDate.getMinutes();
  const ampm = hoursLocal >= 12 ? "PM" : "AM";
  hoursLocal = hoursLocal % 12;
  hoursLocal = hoursLocal ? hoursLocal : 12;
  const minutesStr = minutesLocal < 10 ? "0" + minutesLocal : minutesLocal;

  return `${hoursLocal}:${minutesStr} ${ampm}`;
}

// Wait for the DOM content to load before doing anything
document.addEventListener("DOMContentLoaded", function () {
  // Fetch the location from the IP address
  fetch("https://ipapi.co/json")
    .then((response) => response.json())
    .then((data) => {
      // Store details in the locationData variable
      const locationData = data;

      // Show location data in the DOM
      locationSection.innerHTML = `<p>
      <img src="icons/mapPin.svg"> 
      ${locationData.city}, ${locationData.country_name}
      </p>
      <p>
      <img src="icons/compass.svg"> 
      Lat: ${locationData.latitude}, Long: ${locationData.longitude}
      </p>
      <p id="localTime" >
      <img src="icons/clock.svg">
      Local Time: 
      </p>
      <p>
      <img src="icons/calendar.svg"> 
      Timezone: ${locationData.timezone}
      </p>
      <p id="sunrise"><img src="icons/sunrise.svg"></p>
      <p id="sunset"><img src="icons/sunset.svg"></p>`;

      // Update the clock Realtime
      updateTime(locationData.timezone);

      // Fetch Weather Details from Open Meteo
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${locationData.latitude}&longitude=${locationData.longitude}&current_weather=true&hourly=apparent_temperature,wind_speed_10m,relative_humidity_2m,surface_pressure,precipitation_probability,shortwave_radiation,direct_normal_irradiance,diffuse_radiation&daily=sunrise,sunset
`
      )
        .then((res) => res.json())
        .then((weather) => {
          sunrise = document.getElementById("sunrise");
          sunset = document.getElementById("sunset");
          console.log();
          sunrise.innerHTML += `Sunrise: ${simpleTime(
            weather.daily.sunrise[0],
            locationData.utc_offset
          )}`;
          sunset.innerHTML += `Sunset: ${simpleTime(
            weather.daily.sunset[0],
            locationData.utc_offset
          )}`;
          weatherSection.innerHTML = `${getWeatherIcon(
            mapWeatherCodeToDescription(weather.current_weather.weathercode)
          )}
          <p class="temperature">${weather.current_weather.temperature}${
            weather.current_weather_units.temperature
          }</p>
          <p class="condition">${mapWeatherCodeToDescription(
            weather.current_weather.weathercode
          )}</p>
                      <div class="weather-details">
                <p>
                    <img src="icons/thermometer.svg" />
                    Feels like: ${mapcurrentTimeToHourlyData(weather)[0]}${
            weather.hourly_units.apparent_temperature
          }
                </p>
                <p>
                    <img src="icons/droplets.svg" />
                    Humidity: ${mapcurrentTimeToHourlyData(weather)[2]}${
            weather.hourly_units.relative_humidity_2m
          }
                </p>
                <p>
                    <img src="icons/wind.svg" />
                    Wind: ${mapcurrentTimeToHourlyData(weather)[1]} ${
            weather.hourly_units.wind_speed_10m
          } ${getWindDirection(weather.current_weather.winddirection)}
                </p>
                <p>
                    <img src="icons/compass.svg" />
                    Pressure: ${mapcurrentTimeToHourlyData(weather)[3]}${
            weather.hourly_units.surface_pressure
          }
                </p>
                <p>
                    <img src="icons/sun.svg" />
                    UV Index: ${calculateUVIndex(
                      mapcurrentTimeToHourlyData(weather)
                    )}
                </p>
                <p>
                    <img src="icons/cloudRain.svg" />
                    Precipitation: ${mapcurrentTimeToHourlyData(weather)[4]}${
            weather.hourly_units.precipitation_probability
          }
                </p>
            </div>
          `;
        })
        // Handling errors when fetching Weather
        .catch((err) => {
          console.error("Error fetching weather", err);
        });

      // Fetch Local News
      fetch(
        `http://localhost:8000?string=${locationData.city} ${locationData.country_name}`
      )
        .then((res) => res.text())
        .then((news) => {
          const parser = new DOMParser();
          const newsXML = parser.parseFromString(news, "application/xml");
          const items = newsXML.getElementsByTagName("item");
          Array.from(items).forEach((item) => {
            const title = item.getElementsByTagName("title")[0].textContent;
            const description =
              item.getElementsByTagName("description")[0].textContent;
            const descriptionParser = new DOMParser();
            const descriptionDoc = descriptionParser.parseFromString(
              description,
              "text/html"
            );
            const descriptionLink = descriptionDoc.querySelector("a")?.href;
            const source = item.getElementsByTagName("source")[0].textContent;

            localNewsSection.innerHTML += `
            <a href="${descriptionLink}">
                    <li>
                    <h3>${title}</h3>
                    <p class="news-source">Source: ${source}</p>
                </li>
                </a>
          `;
          });
        })
        .catch((err) => {
          console.error("Error fetching local news", err);
        });

      // Fetch National News
      fetch(`http://localhost:8000?string=${locationData.country_name}`)
        .then((res) => res.text())
        .then((news) => {
          const parser = new DOMParser();
          const newsXML = parser.parseFromString(news, "application/xml");
          const items = newsXML.getElementsByTagName("item");
          Array.from(items).forEach((item) => {
            const title = item.getElementsByTagName("title")[0].textContent;
            const description =
              item.getElementsByTagName("description")[0].textContent;
            const descriptionParser = new DOMParser();
            const descriptionDoc = descriptionParser.parseFromString(
              description,
              "text/html"
            );
            const descriptionLink = descriptionDoc.querySelector("a")?.href;
            const source = item.getElementsByTagName("source")[0].textContent;

            nationalNewsSection.innerHTML += `
            <a href="${descriptionLink}">
                    <li>
                    <h3>${title}</h3>
                    <p class="news-source">Source: ${source}</p>
                </li>
                </a>
          `;
          });
        })
        .catch((err) => {
          console.error("Error fetching national news", err);
        });
    })
    // Handling errors when fetching Location
    .catch((error) => {
      console.error("Error fetching location", error);
    });
});
