const axios = require("axios");

//Your Telegram Bot Token from BotFather
const MY_TOKEN = process.env.TELEGRAM_TOKEN;

//Your BASE URL
const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`;

function getAxiosInstance() {
  return {
    get(method, params) {
      return axios.get(`${BASE_URL}/${method}`, {
        params,
      });
    },
    post(method, data) {
      return axios({
        method: "post",
        baseURL: BASE_URL,
        url: `/${method}`,
        data,
      });
    },
  };
}

module.exports = { axiosInstance: getAxiosInstance() };
