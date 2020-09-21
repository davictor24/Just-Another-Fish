import { beforeEach, test } from "tap";
import { stub } from "sinon";

import RobotUser from "../src/RobotUser";
import MainBot from "../src/bots/MainBot";
import LichessApi from "../src/LichessApi";

const gameId = "gid001";
const challengeId = "cid001";
const token = "api token";
const id = "just-another-fish";
const name = "just-another-fish";
const ratedChallenge = {
  "type": "challenge",
  "challenge": {
    "id": challengeId,
    "challenger": { "id": "lovlas" },
    "destUser": { id, name },
    "variant": { "key": "standard", "name": "Standard", "short": "Std" },
    "rated": true,
    "timeControl": { "type": "clock", "limit": 300, "increment": 25, "show": "5+25" },
    "color": "random"
  }
};
const unratedChallenge = JSON.parse(JSON.stringify(ratedChallenge));
unratedChallenge.challenge.rated = false;
const gameStart = { "type": "gameStart", "game": { "id": gameId } };
const gameFullWhite = {
  "type": "gameFull",
  "id": gameId,
  "rated": false,
  "variant": { "key": "standard", "name": "Standard", "short": "Std" },
  "clock": { "initial": 1200000, "increment": 10000 },
  "white": { id, name },
  "black": { "id": "leela", "name": "Leela" },
  "initialFen": "startpos",
  "state": { "type": "gameState", "moves": "" }
};
const gameFullBlack = JSON.parse(JSON.stringify(gameFullWhite));
gameFullBlack.white.id = "other";
gameFullBlack.white.name = "Other";
const chatOther = { "type": "chatLine", "username": "Other", "text": "Hello", "room": "player" };
const chatSelf = { "type": "chatLine", "username": name, "text": "Hello", "room": "player" };

/**
 * The idea of this test suite is to take the ensemble of classes through a 
 * login, accept challenge and game play sequence of actions against a mock lichess.
 */

var robotUser;
var lichessApi;
var accountInfo;
var declineChallenge;
var acceptChallenge;
var streamEvents;
var streamGame;
var makeMove;
var chat;

beforeEach(function(t) {
  lichessApi = new LichessApi(token);
  accountInfo = stub(lichessApi, "accountInfo");
  declineChallenge = stub(lichessApi, "declineChallenge");
  acceptChallenge = stub(lichessApi, "acceptChallenge");
  makeMove = stub(lichessApi, "makeMove");
  chat = stub(lichessApi, "chat");
  streamEvents = stub(lichessApi, "streamEvents");
  streamGame = stub(lichessApi, "streamGame");

  accountInfo.returns({ data: { "id": "just-another-fish", "username": "just-another-fish" } });
  declineChallenge.returns({ data: { "ok": true } });
  acceptChallenge.returns({ data: { "ok": true } });

  robotUser = new RobotUser(lichessApi, new MainBot());

  t();
});

async function startAndGetEventHandler(t) {
  const response = await robotUser.start();
  t.equal(response.data.id, "just-another-fish", "user id returned");
  t.ok(accountInfo.calledOnce, "accountInfo called once");
  t.ok(streamEvents.calledOnce, "streamEvents called once");
  return streamEvents.getCall(0).args[0];
}

async function startGameAndGetGameHandler(t) {
  const eventHandler = await startAndGetEventHandler(t);
  eventHandler(gameStart);
  t.ok(streamGame.calledOnce, "streamGame called once");
  t.equal(streamGame.getCall(0).args[0], gameId);
  return streamGame.getCall(0).args[1];
}

test("decline rated game", async function(t) {
  const eventHandler = await startAndGetEventHandler(t);
  eventHandler(ratedChallenge);
  t.ok(declineChallenge.calledOnce, "declineChallenge called once");
  t.equal(declineChallenge.getCall(0).args[0], challengeId, "called with correct challenge id");
  t.end();
});

test("accept unrated game", async function(t) {
  const eventHandler = await startAndGetEventHandler(t);
  eventHandler(unratedChallenge);
  t.ok(acceptChallenge.calledOnce, "acceptChallenge called once");
  t.equal(acceptChallenge.getCall(0).args[0], challengeId, "called with correct challenge id");
  t.end();
});

test("game start as white", async function(t) {
  const gameEventHandler = await startGameAndGetGameHandler(t);
  gameEventHandler(gameFullWhite);
  t.ok(makeMove.calledOnce, "makeMove called once");
  t.end();
});

test("game start as black", async function(t) {
  const gameEventHandler = await startGameAndGetGameHandler(t);
  gameEventHandler(gameFullBlack);
  t.ok(makeMove.notCalled, "makeMove notCalled");
  gameEventHandler({ "type": "gameState", "moves": "e2e4" });
  t.ok(makeMove.calledOnce, "makeMove called once");
  t.end();
});

test("game chat", async function(t) {
  const gameEventHandler = await startGameAndGetGameHandler(t);
  gameEventHandler(chatSelf);
  t.ok(chat.notCalled, "chat not called");
  gameEventHandler(chatOther);
  t.ok(chat.calledOnce, "chat called once");
  t.end();
});
