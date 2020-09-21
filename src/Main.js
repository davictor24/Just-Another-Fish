import express from "express";
import LichessApi from "./LichessApi";
import RobotUser from "./RobotUser";
import MainBot from "./bots/MainBot";

async function startBot(token, player) {
  if (token) {
    const robot = new RobotUser(new LichessApi(token), player);
    const username = (await robot.start()).data.username;
    return `<a href="https://lichess.org/@/${username}">${username}</a> on lichess.</h1><br>`;
  }
}

async function begin() {
  var links = "<h1>Challenge:</h1><br>";
  links += await startBot(process.env.API_TOKEN, new MainBot());
  const PORT = process.env.PORT || 5000;
  express()
    .get("/", (req, res) => res.send(links))
    .listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

begin();
