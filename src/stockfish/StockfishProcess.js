import { spawn } from "child_process";
// import fs from "fs";

class StockfishProcess {
  constructor() {
    this.process = spawn(__dirname + "/stockfish");
    this.stdoutHandlers = {};

    this.process.stdout.on("data", data => {
      console.log(data.toString());
      Object.values(this.stdoutHandlers).forEach(handler => handler(data.toString()));
    });

    this.process.stderr.on("data", data => {
      console.log(data.toString());
    });

    this.process.on("close", code => {
      console.log(`Child process exited with code ${code}`);
      console.log("Engine stopped");
    });

    this.process.stdin.write("uci\n");
  }

  start() {
    this.setup()
      .then(() => this.process.stdin.write("ucinewgame\n"))
      .then(() => console.log("Setup complete"));
  }

  stop() {
    this.process.kill();
  }

  setup() {
    return new Promise(resolve => {
      const handlerKey = "setup";
      this.stdoutHandlers[handlerKey] = data => {
        if (data == "readyok") {
          delete this.stdoutHandlers[handlerKey]
          resolve(data);
        }
      };

      this.process.stdin.write("setoption name Hash value 64\n");
      this.process.stdin.write("setoption name Use NNUE value true\n");
      this.process.stdin.write("setoption name EvalFile value nn-bbbbfff71045.nnue\n");
      this.process.stdin.write("isready\n");
    });
  }

  bestMove(moves, times, incs) {
    return new Promise(resolve => { 
      const handlerKey = "bestMove";
      this.stdoutHandlers[handlerKey] = data => {
        const regex = /bestmove (\w{4})/;
        const found = data.match(regex);
        if (found && found.length > 1) {
          delete this.stdoutHandlers[handlerKey]
          resolve(found[1]);
        }
      };

      let positionCmd = "position startpos";
      if (moves.length > 0) positionCmd += " moves " + moves.join(" ");
      this.process.stdin.write(positionCmd + "\n");
      this.process.stdin.write(`go wtime ${times[0]} btime ${times[1]} winc ${incs[0]} binc ${incs[1]}\n`);
    });
  }
}

export default StockfishProcess;