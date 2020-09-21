import ChessUtils from "../utils/ChessUtils";

class MainBot {
  async getNextMove(moves, engine, times, incs) {
    const chess = new ChessUtils();
    if (engine == undefined || times == undefined || incs == undefined) {
      chess.applyMoves(moves);
      const legalMoves = chess.legalMoves();
      if (legalMoves.length) {
        return chess.pickRandomMove(legalMoves);
      }
    } else {
      let bestMove = await engine.bestMove(moves, times, incs);
      console.log(bestMove);
      return bestMove;
    }
  }

  getReply(chat) {
    return "";
  }
}

export default MainBot;
