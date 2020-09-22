import Game from "./Game";
import StockfishWorker from "./stockfish/StockfishWorker";

/**
 * RobotUser listens for challenges and spawns Games on accepting.
 *  
 */
class RobotUser {

  /**
   * Initialise with access token to lichess and a player algorithm.
   */
  constructor(api, player) {
    this.api = api;
    this.player = player;
    this.games = {}
    this.engines = {}
  }

  async start() {
    this.account = await this.api.accountInfo();
    console.log("Playing as " + this.account.data.username);
    this.api.streamEvents((event) => this.eventHandler(event));
    return this.account;
  }

  eventHandler(event) {
    switch (event.type) {
      case "challenge":
        this.handleChallenge(event.challenge);
        break;
      case "gameStart":
        this.handleGameStart(event.game.id);
        break;
      case "gameFinish":
        this.handleGameFinish(event.game.id);
        break;
      default:
        console.log("Unhandled event : " + JSON.stringify(event));
    }
  }

  handleGameStart(id) {
    this.engines[id] = new StockfishWorker();
    this.games[id] = new Game(this.api, this.account.data.username, this.player, this.engines[id]);
    this.games[id].start(id);
  }

  handleGameFinish(id) {
    this.engines[id].stop();
    setTimeout(() => {
      delete this.games[id];
      delete this.engines[id];
    }, 3000);
  }

  async handleChallenge(challenge) {
    if (challenge.variant.key != "standard") {
      console.log("Declining non-standard challenge from " + challenge.challenger.id);
      const response = await this.api.declineChallenge(challenge.id);
      if (response != undefined) console.log("Declined", response.data || response);
    } else {
      console.log("Accepting challenge from " + challenge.challenger.id);
      const response = await this.api.acceptChallenge(challenge.id);
      if (response != undefined) console.log("Accepted", response.data || response);
    }
  }

}

export default RobotUser;
