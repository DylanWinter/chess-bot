import { useState } from 'react'
import {Chessboard} from "react-chessboard";
import {Chess, Move} from "chess.js";
import {Engine} from "./Minimax.ts";
import './App.css'

const DEPTH:number = 4

function App() {
    const [game, setGame] = useState(new Chess());
    const [evaluation, setEvaluation] = useState(null);
    const [movesEvaluated, setMovesEvaluated] = useState(0);
    const [evaluationTime, setEvaluationTime] = useState(0);
    const engine = new Engine();

    function onDrop(sourceSquare:any, targetSquare:any) {
        const gameCopy = new Chess(game.fen());
        const move:Move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q"
        });

        if (move === null) {
            return false;
        }
        setGame(gameCopy)

        const startTime:number = performance.now()
        let result:any = engine.calculateMove(gameCopy.fen(), DEPTH, false)
        const endTime:number = performance.now()
        let bestMove:Move = result[1]

        if (bestMove !== null) {
            gameCopy.move(bestMove)
        }

        setGame(gameCopy)
        setEvaluation(result[0]);
        setMovesEvaluated(Engine.movesEvaluated);
        setEvaluationTime(((endTime - startTime) / 1000));
        return true;
    }

    function handlePromotion(piece:any, promoteToSquare:any) {
        const gameCopy = new Chess(game.fen());
        gameCopy.put({type: piece[1], color:piece[0]}, promoteToSquare)
        setGame(gameCopy)
        return true
    }


    return (
        <div className="chessboard-container">
            <Chessboard position={game.fen()} onPieceDrop={onDrop} onPromotionPieceSelect={handlePromotion}/>
            <div className="engine-results">
                <p>Evaluation: {evaluation}</p>
                <p>Moves Evaluated: {movesEvaluated}</p>
                <p>Evaluation Time: {evaluationTime} seconds</p>
            </div>
        </div>
    )
}

export default App
