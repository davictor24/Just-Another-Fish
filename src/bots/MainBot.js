import ChessUtils from "../utils/ChessUtils";

class MainBot {
  getNextMove(moves) {
    const chess = new ChessUtils();
    chess.applyMoves(moves);
    const legalMoves = chess.legalMoves();
    if (legalMoves.length) {
      return chess.pickRandomMove(legalMoves);
    }
  }

  getReply(chat) {
    return "hi";
  }
}

export default MainBot;
