import {Chess, Move} from "chess.js";

export class Engine
{
    static Values: Record<string, number> = {
    'p': 100,
    'n': 300,
    'b': 320,
    'r': 500,
    'q': 900
    }

    static movesEvaluated:number = 0
    static branchesPruned:number = 0
    static game:Chess = new Chess()

    static transpositionTable:Map<string, {eval : number, bestMove : Move}> = new Map()

    calculateMove(position: string, maxDepth: number, isWhite: boolean = true): any[] {
        let evaluation:number = 0
        let bestMove:any = null

        Engine.movesEvaluated = 0
        Engine.branchesPruned = 0

        for (let depth:number = 0; depth <= maxDepth; depth++) {
            Engine.game = new Chess(position)
            console.log("evaluating at depth", depth)
            let result:any[] = this.minimax(depth, isWhite)
            evaluation = result[0]
            bestMove = result[1]
        }
        return [evaluation, bestMove]
    }

    minimax(depth: number, isMax: boolean = true, alpha: number = -Infinity, beta: number = Infinity): any[] {
        if (depth === 0 || Engine.game.isGameOver()) {
            return [this.evaluate(isMax), null]
        }
        // max player (white by default)
        if (isMax) {
            let maxEval: number = -Infinity;
            let bestMove: any = null;
            let moves:Move[] = Engine.game.moves({verbose: true})
            // ordering moves allows for more branches to be pruned using alpha-beta pruning
            moves = this.orderMoves(moves)
            for (const move of moves) {
                Engine.movesEvaluated++
                Engine.game.move(move.san)
                let evaluation: number = this.minimax(depth - 1, false, alpha, beta)[0]
                if (evaluation > maxEval) {
                    maxEval = evaluation;
                    alpha = Math.max(evaluation, alpha)
                    bestMove = move
                }
                // reset position
                Engine.game.undo()
                // prune this branch if it leads to a worse outcome
                if (beta <= alpha) {
                    Engine.branchesPruned++
                    break
                }
            }
            // update transposition table
            Engine.transpositionTable.set(Engine.game.fen(), {eval: maxEval, bestMove: bestMove})
            return [maxEval, bestMove];
        }
        // min player (black by default)
        else {
            let minEval: number = Infinity;
            let bestMove: any = null;
            let moves:Move[] = Engine.game.moves({verbose: true})
            // ordering moves allows for more branches to be pruned using alpha-beta pruning
            moves = this.orderMoves(moves)
            for (const move of moves) {
                Engine.game.move(move.san)
                let evaluation: number = this.minimax(depth - 1, true, alpha, beta)[0]
                if (evaluation < minEval) {
                    minEval = evaluation;
                    beta = Math.min(evaluation, beta)
                    bestMove = move
                }
                // reset position
                Engine.game.undo()
                // prune this branch if it leads to a worse outcome
                if (beta <= alpha) {
                    Engine.branchesPruned++
                    break
                }
            }
            // update transposition table
            Engine.transpositionTable.set(Engine.game.fen(), {eval: minEval, bestMove: bestMove})
            return [minEval, bestMove];
        }
    }

    evaluate(isMax:boolean): number {
        // for now, this just counts the material sum for each side
        // TODO better evaluation function

        if (Engine.game.isCheckmate()) return isMax ? -Infinity : Infinity;
        if (Engine.game.isStalemate() || Engine.game.isDraw()) return 0;
        if (Engine.transpositionTable.has(Engine.game.fen())) {
            // @ts-ignore object is potentially undefined
            return Engine.transpositionTable.get(Engine.game.fen()).eval
        }

        let board:any[] = Engine.game.board()
        let sum: number = 0;
        for (let row of board) {
            for (let square of row) {
                if (square === null) continue
                if (Engine.Values.hasOwnProperty(square.type)) {
                    if (square.color === 'w') {
                        sum += Engine.Values[square.type]
                    }
                    else {
                        sum -= Engine.Values[square.type]
                    }
                }
            }
        }

        return sum
    }

    orderMoves(moves:Move[]) {
        // Fetch the best move from the transposition table
        let transposed:any = null;
        if (Engine.transpositionTable.has(Engine.game.fen())) {
            transposed = Engine.transpositionTable.get(Engine.game.fen());
        }

        // Prioritize the best move if it exists
        if (transposed) {
            const bestMoveSan = transposed.bestMove.san;
            // Check if the best move exists and is valid in the current position
            if (moves.some(move => move.san === bestMoveSan)) {
                moves.unshift(transposed.bestMove); // Move it to the top
            }
        }

        // Sorts moves based on a guess of how good they are
        moves.sort((a:Move, b:Move) => {
            let guessA:number = 0, guessB:number = 0
            // Prioritize capturing valuable pieces with less valuable pieces
            if (a.captured !== undefined) {
                guessA += 10 * Engine.Values[a.captured] - Engine.Values[a.piece]
            }
            if (a.promotion !== undefined) {
                guessA += Engine.Values[a.promotion]
            }
            if (b.captured !== undefined) {
                guessB += 10 * Engine.Values[b.captured] - Engine.Values[b.piece]
            }
            if (b.promotion !== undefined) {
                guessB += Engine.Values[b.promotion]
            }

            return guessB - guessA
        })
        return moves
    }
}