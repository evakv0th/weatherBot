require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const storage = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Hello! This bot can show you the weather for any city.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Get Weather", callback_data: "get_weather" }],
        ],
      },
    }
  );
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  switch (data) {
    case "get_weather":
      const userDataWeather = getUserData(chatId);
      userDataWeather.waitingForCity = true;
      userDataWeather.waitingForWeather = true;
      bot.sendMessage(
        chatId,
        "Please enter the name of the city or send /stop to cancel:"
      );
      break;
    default:
      break;
  }
});

function getUserData(chatId) {
  let userData = storage[chatId];
  if (!userData) {
    userData = {
      waitingForCity: false,
      waitingForWeather: false,
    };
    storage[chatId] = userData;
  }
  return userData;
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const userData = getUserData(chatId);
  if (userData && userData.waitingForCity) {
    const city = text;
    let messageText = "";
    messageText = await getWeatherData(city);
    bot.sendMessage(chatId, messageText);
    resetUserData(chatId);
  }
});

function resetUserData(chatId) {
  const userData = getUserData(chatId);
  userData.waitingForCity = false;
  userData.waitingForWeather = false;
}

async function getWeatherData(city) {
  const response = await axios.get(
    `http://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${OPENWEATHERMAP_API_KEY}`
  );
  const weatherData = response.data;
  const weatherDescription = weatherData.weather[0].description;
  const temperature = Math.round(weatherData.main.temp - 273.15);
  const messageText = `The weather in ${city} is currently ${weatherDescription} with a temperature of ${temperature}°C.`;
  return messageText;
}