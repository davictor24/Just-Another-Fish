import stockfish from "stockfish";

class StockfishWorker {
  constructor() {
    this.worker = stockfish();
    this.worker.onmessage = data => {
      console.log(data);
    };
    this.worker.postMessage("uci");
  }

  start() {
    this.setupHash()
      .then(data => this.worker.postMessage("ucinewgame"))
      .then(() => console.log("Setup complete"));
  }

  stop() {
    this.worker.postMessage("stop");
    this.worker.postMessage("quit");
    console.log("Engine stopped");
  }

  setupHash() {
    return new Promise(resolve => { 
      this.worker.onmessage = data => {
        console.log(data);
        if (data == "readyok") {
          this.worker.onmessage = null;
          resolve(data);
        }
      };
      this.worker.postMessage("setoption name Hash value 64");
      this.worker.postMessage("isready");
    });
  }

  bestMove(moves, times, incs) {
    return new Promise(resolve => { 
      this.worker.onmessage = data => {
        console.log(data);
        const regex = /bestmove (\w{4})/;
        const found = data.match(regex);
        if (found && found.length > 1) {
          this.worker.onmessage = null;
          resolve(found[1]);
        }
      };

      let positionCmd = "position startpos";
      if (moves.length > 0) positionCmd += " moves " + moves.join(" ");
      this.worker.postMessage(positionCmd);
      this.worker.postMessage(`go wtime ${times[0]} btime ${times[1]} winc ${incs[0]} binc ${incs[1]}`);
    });
  }
}

export default StockfishWorker;