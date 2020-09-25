import { spawn } from "child_process";
import fs from "fs";

class StockfishProcess {
  constructor() {
    this.process = spawn("./polyglot"); // Engine wrapper for opening books
    this.stdoutHandlers = {};
    this.ponderMove = "";

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

      let nnueFile;
      fs.readdirSync(__dirname).some(file => {
        if (file.match(/^.*\.nnue$/)) {
          nnueFile = file;
          return true;
        }
      });

      this.process.stdin.write("setoption name Hash value 32\n");
      this.process.stdin.write("setoption name Slow Mover value 50\n");
      this.process.stdin.write("setoption name Use NNUE value true\n");
      if (nnueFile) this.process.stdin.write(`setoption name EvalFile value ${nnueFile}\n`);
      this.process.stdin.write("setoption name Ponder value true\n");
      this.process.stdin.write("isready\n");
    });
  }

  bestMove(moves, times, incs) {
    return new Promise(resolve => {
      let expectedOutputCount = 1;
      const startTime = new Date().getTime();
      const handlerKey = "bestMove";
      this.stdoutHandlers[handlerKey] = data => {
        const regex = /bestmove (\w{4,})(?: ponder (\w{4,}))?/;
        const found = data.match(regex);
        if (found && found.length > 1) {
          if (--expectedOutputCount != 0) return;

          resolve(found[1].slice(0, 4));
          delete this.stdoutHandlers[handlerKey];

          if (found[2] == null) {
            this.ponderMove = "";
            return;
          }

          const delta = new Date().getTime() - startTime;
          const whitePlayed = moves.length % 2 == 0;
          const newWtime = whitePlayed ? times[0] - delta + incs[0] : times[0];
          const newBtime = whitePlayed ? times[1] : times[1] - delta + incs[1];

          this.process.stdin.write(`position startpos moves ${moves.join(" ")} ${found[1]} ${found[2]}\n`);
          this.process.stdin.write(`go ponder wtime ${newWtime} btime ${newBtime} winc ${incs[0]} binc ${incs[1]}\n`);
          this.ponderMove = found[2];
        }
      };

      if (moves[moves.length - 1] == this.ponderMove) {
        this.process.stdin.write("ponderhit\n");
      } else {
        if (this.ponderMove != "") expectedOutputCount = 2;
        this.process.stdin.write("stop\n");
        let positionCmd = "position startpos";
        if (moves.length > 0) positionCmd += " moves " + moves.join(" ");
        this.process.stdin.write(positionCmd + "\n");
        this.process.stdin.write(`go wtime ${times[0]} btime ${times[1]} winc ${incs[0]} binc ${incs[1]}\n`);
      }
    });
  }
}

export default StockfishProcess;