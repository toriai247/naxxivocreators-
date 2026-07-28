import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackArrowIcon } from '../common/AppIcons';
import Button from '../common/Button';

interface ReversiPageProps {
    onBack: () => void;
}

const PLAYER = 1;
const AI = 2;
const BOARD_SIZE = 8;
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

const createInitialBoard = () => {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    const mid = BOARD_SIZE / 2;
    board[mid - 1][mid - 1] = AI;
    board[mid - 1][mid] = PLAYER;
    board[mid][mid - 1] = PLAYER;
    board[mid][mid] = AI;
    return board;
};

const ReversiPage: React.FC<ReversiPageProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [board, setBoard] = useState(createInitialBoard());
    const [currentPlayer, setCurrentPlayer] = useState(PLAYER);
    const [scores, setScores] = useState({ [PLAYER]: 2, [AI]: 2 });
    const [winner, setWinner] = useState<number | 'draw' | null>(null);
    const [validMoves, setValidMoves] = useState<number[][]>([]);

    const getPiecesToFlip = useCallback((board: number[][], r: number, c: number, player: number) => {
        const opponent = player === PLAYER ? AI : PLAYER;
        const allPiecesToFlip = [];

        for (const [dr, dc] of DIRECTIONS) {
            let piecesInDirection = [];
            let row = r + dr;
            let col = c + dc;

            while (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === opponent) {
                piecesInDirection.push([row, col]);
                row += dr;
                col += dc;
            }

            if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === player && piecesInDirection.length > 0) {
                allPiecesToFlip.push(...piecesInDirection);
            }
        }
        return allPiecesToFlip;
    }, []);

    const getValidMoves = useCallback((board: number[][], player: number) => {
        const moves: number[][] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === 0) {
                    const piecesToFlip = getPiecesToFlip(board, r, c, player);
                    if (piecesToFlip.length > 0) {
                        moves.push([r, c]);
                    }
                }
            }
        }
        return moves;
    }, [getPiecesToFlip]);


    const calculateScores = (board: number[][]) => {
        let p1Score = 0;
        let p2Score = 0;
        board.forEach(row => row.forEach(cell => {
            if (cell === PLAYER) p1Score++;
            if (cell === AI) p2Score++;
        }));
        setScores({ [PLAYER]: p1Score, [AI]: p2Score });
    };

    const placePiece = (r: number, c: number, player: number) => {
        const newBoard = board.map(row => [...row]);
        const piecesToFlip = getPiecesToFlip(newBoard, r, c, player);
        
        if (piecesToFlip.length === 0) return null;

        newBoard[r][c] = player;
        piecesToFlip.forEach(([fr, fc]) => {
            newBoard[fr][fc] = player;
        });

        return newBoard;
    };
    
    useEffect(() => {
        setValidMoves(getValidMoves(board, currentPlayer));
    }, [board, currentPlayer, getValidMoves]);


    const handlePlayerMove = (r: number, c: number) => {
        if (gameState !== 'playing' || currentPlayer !== PLAYER) return;

        const newBoard = placePiece(r, c, PLAYER);
        if (newBoard) {
            setBoard(newBoard);
            calculateScores(newBoard);
            setCurrentPlayer(AI);
        }
    };
    
    const handleAiMove = useCallback(() => {
        const aiValidMoves = getValidMoves(board, AI);
        if (aiValidMoves.length === 0) {
            setCurrentPlayer(PLAYER);
            return;
        }

        let bestMove: number[] | null = null;
        let maxFlipped = -1;

        aiValidMoves.forEach(([r, c]) => {
            const flippedCount = getPiecesToFlip(board, r, c, AI).length;
            if (flippedCount > maxFlipped) {
                maxFlipped = flippedCount;
                bestMove = [r, c];
            }
        });

        if (bestMove) {
            const newBoard = placePiece(bestMove[0], bestMove[1], AI);
            if (newBoard) {
                setTimeout(() => {
                    setBoard(newBoard);
                    calculateScores(newBoard);
                    setCurrentPlayer(PLAYER);
                }, 700);
            }
        } else {
             setCurrentPlayer(PLAYER);
        }
    }, [board, getPiecesToFlip, getValidMoves]);
    
    useEffect(() => {
        if (gameState === 'playing' && currentPlayer === AI) {
            handleAiMove();
        }
    }, [currentPlayer, gameState, handleAiMove]);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const playerMoves = getValidMoves(board, PLAYER);
        const aiMoves = getValidMoves(board, AI);

        if (playerMoves.length === 0 && aiMoves.length === 0) {
            setGameState('gameOver');
            if (scores[PLAYER] > scores[AI]) setWinner(PLAYER);
            else if (scores[AI] > scores[PLAYER]) setWinner(AI);
            else setWinner('draw');
        } else if (currentPlayer === PLAYER && playerMoves.length === 0) {
            setCurrentPlayer(AI);
        } else if (currentPlayer === AI && aiMoves.length === 0) {
            setCurrentPlayer(PLAYER);
        }

    }, [board, currentPlayer, gameState, getValidMoves, scores]);


    const startGame = () => {
        setBoard(createInitialBoard());
        setCurrentPlayer(PLAYER);
        setScores({ [PLAYER]: 2, [AI]: 2 });
        setWinner(null);
        setGameState('playing');
    };
    
    const renderModal = () => {
        let title = "";
        let message = "";
        let buttonText = "";
        
        if (gameState === 'start') {
            title = "Welcome to Reversi!";
            message = "The goal is to have more pieces of your color on the board than your opponent by the end of the game.";
            buttonText = "Start Game";
        } else if (gameState === 'gameOver') {
            title = "Game Over!";
            if (winner === PLAYER) message = "Congratulations, you win!";
            else if (winner === AI) message = "The AI wins. Better luck next time!";
            else message = "It's a draw!";
            buttonText = "Play Again";
        }

        return (
            <AnimatePresence>
                {(gameState === 'start' || gameState === 'gameOver') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-[var(--theme-card-bg)] p-6 rounded-2xl shadow-lg text-center max-w-sm"
                        >
                            <h2 className="text-2xl font-bold text-[var(--theme-text)]">{title}</h2>
                            <p className="text-sm text-[var(--theme-text-secondary)] my-4">{message}</p>
                            <Button onClick={startGame}>{buttonText}</Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">Reversi</h1>
                <div className="w-6"></div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4 relative">
                {renderModal()}
                <div className="flex justify-between w-full max-w-sm mb-6 px-2">
                    <div className={`flex-1 text-left transition-all duration-300 p-2 rounded-lg ${currentPlayer === PLAYER ? 'bg-[var(--theme-primary)]/20' : ''}`}>
                        <p className="text-sm font-semibold text-[var(--theme-text)]">You</p>
                        <p className="font-bold text-4xl text-[var(--theme-text)]">{scores[PLAYER]}</p>
                    </div>
                    <div className={`flex-1 text-right transition-all duration-300 p-2 rounded-lg ${currentPlayer === AI ? 'bg-black/5' : ''}`}>
                        <p className="text-sm font-semibold text-[var(--theme-text-secondary)]">AI</p>
                        <p className="font-bold text-4xl text-[var(--theme-text-secondary)]">{scores[AI]}</p>
                    </div>
                </div>

                <div className="aspect-square w-full max-w-sm bg-sky-200 p-1 rounded-lg shadow-lg grid grid-cols-8 gap-0">
                    {board.map((row, r) =>
                        row.map((cell, c) => {
                             const isPlayer = cell === PLAYER;
                            const isAi = cell === AI;
                            const isEmpty = cell === 0;
                            const isValidMove = validMoves.some(([vr, vc]) => vr === r && vc === c);
                            
                            return (
                                <button
                                    key={`${r}-${c}`}
                                    onClick={() => handlePlayerMove(r, c)}
                                    disabled={gameState !== 'playing' || currentPlayer !== PLAYER || !isValidMove}
                                    className="aspect-square flex items-center justify-center p-1 relative focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--theme-primary)] rounded-sm"
                                >
                                    <motion.div
                                        key={`${r}-${c}-${cell}`}
                                        initial={{ scale: 0.5 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className={`w-full h-full rounded-full flex items-center justify-center
                                            ${isPlayer ? 'bg-slate-800 shadow-md' : ''}
                                            ${isAi ? 'bg-white border-2 border-slate-300 shadow-md' : ''}
                                            ${isEmpty ? 'border-2 border-sky-400/50' : ''}
                                        `}
                                    >
                                        {isEmpty && isValidMove && currentPlayer === PLAYER && (
                                            <motion.div 
                                                className="w-1/2 h-1/2 bg-slate-800/30 rounded-full"
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        )}
                                    </motion.div>
                                </button>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReversiPage;