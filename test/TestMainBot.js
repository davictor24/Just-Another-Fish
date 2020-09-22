import test from "tape";
import MainBot from "../src/bots/MainBot";

const player = new MainBot();

"use strict";

test("getReply", function(t) {
  t.equal(player.getReply({}), "", "says nothing");
  t.end();
});

test("getNextMove", async function(t) {
  t.ok(await player.getNextMove([]), "move played from initial position");
  t.notOk(await player.getNextMove(["e2e4", "a7a6", "f1c4", "a8a7", "d1h5", "a7a8", "c4f7"]), "no moves available");
  t.end();
});
