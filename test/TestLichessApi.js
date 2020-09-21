import { beforeEach, afterEach, test } from "tap";
import moxios from "moxios";
import nock from "nock";
import ndjson from "ndjson";
import LichessApi from "../src/LichessApi";

const gameId = "gid001";
const challengeId = "cid001";
const secret = "secret api token";
const accountResponse = { status: 200, response: { "id": "just-another-fish", "username": "just-another-fish" } };
const okResponse = { status: 200, response: { "ok": true } };
const eventResponse = { id: "1", type: "event" };
const gameEventResponse = { id: "2", type: "move" };

const api = new LichessApi(secret);

"use strict";

function assertRequest(t, method, pathregexp, response) {
  moxios.wait(function() {
    let request = moxios.requests.mostRecent();
    t.equal(request.config.method, method, "correct method");
    t.ok(pathregexp.test(request.config.url), "correct path");
    t.equal(request.headers.Authorization, "Bearer " + secret, "credentials are correct");
    request.respondWith(response);
  });
}

beforeEach(function(t) {
  moxios.install();
  t();
});

afterEach(function(t) {
  moxios.uninstall();
  t();
});

test("streamEvents", function(t) {
  const serialize = ndjson.serialize();
  nock("https://lichess.org")
    .get("/api/stream/event")
    .reply((uri, requestBody) => serialize);
  serialize.write(eventResponse);
  api.streamEvents(x => {
    console.log("Callback");
    t.ok(true, "callback called");
    t.end();
  });
});

test("streamEventsEnd", function(t) {
  t.end();
});

test("streamGame", function(t) {
  const serialize = ndjson.serialize();
  nock("https://lichess.org")
    .get(`/api/bot/game/stream/${gameId}`)
    .reply((uri, requestBody) => serialize);
  serialize.write(gameEventResponse);
  api.streamGame(gameId, x => {
    console.log("Callback");
    t.ok(true, "callback called");
    t.end();
  });
});

test("streamGameEnd", function(t) {
  t.end();
});

test("acceptChallenge", async function(t) {
  assertRequest(t, "post", new RegExp(`api/challenge/${challengeId}/accept`), okResponse);
  const response = await api.acceptChallenge(challengeId);
  t.equal(response.data.ok, true, "response correct");
  t.end();
});

test("declineChallenge", async function(t) {
  assertRequest(t, "post", new RegExp(`api/challenge/${challengeId}/decline`), okResponse);
  const response = await api.declineChallenge(challengeId);
  t.equal(response.data.ok, true, "response correct");
  t.end();
});

test("upgrade", async function(t) {
  assertRequest(t, "post", new RegExp("api/bot/accounts/upgrade"), okResponse);
  const response = await api.upgrade();
  t.equal(response.data.ok, true, "response correct");
  t.end();
});

test("accountInfo", async function(t) {
  assertRequest(t, "get", new RegExp("api/account"), accountResponse);
  const response = await api.accountInfo();
  t.equal(response.data.id, "just-another-fish", "user id returned");
  t.end();
});

test("makeMove", async function(t) {
  const move = "e2e4";
  assertRequest(t, "post", new RegExp(`api/bot/game/${gameId}/move/${move}`), okResponse);
  const response = await api.makeMove(gameId, move);
  t.equal(response.data.ok, true, "response correct");
  t.end();
});

test("abortGame", async function(t) {
  assertRequest(t, "post", new RegExp(`api/bot/game/${gameId}/abort`), okResponse);
  const response = await api.abortGame(gameId);
  t.equal(response.data.ok, true, "response correct");
  t.end();
});

test("resignGame", async function(t) {
  assertRequest(t, "post", new RegExp(`api/bot/game/${gameId}/resign`), okResponse);
  const response = await api.resignGame(gameId);
  t.equal(response.data.ok, true, "response correct");
  t.end();
});

test("chat", async function(t) {
  assertRequest(t, "post", new RegExp(`api/bot/game/${gameId}/chat`), okResponse);
  const response = await api.chat(gameId, "lobby", "hi");
  t.equal(response.data.ok, true, "response correct");
  t.end();
});
