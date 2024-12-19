## A chess engine written in TypeScript.

It uses Minimax with:
- Alpha-beta pruning.
- Move ordering that prioritizes captures and promotions, for better pruning. 
- Iterative deepening to populate a transposition table, again for better pruning.

### Credit

[Chess.js](https://www.npmjs.com/package/chess.js/v/0.13.0?activeTab=readme) is used for the game state.

[react-chessboard](https://www.npmjs.com/package/react-chessboard) is used for the UI.
