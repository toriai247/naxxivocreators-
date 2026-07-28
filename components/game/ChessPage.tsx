import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PIECES = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙',
};

const initialBoard: (string | null)[][] = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

const ChessPage: React.FC = () => {
    const [board, setBoard] = useState<(string | null)[][]>(initialBoard);
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);
    const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(null);
    // Not implementing full valid moves for simplicity for now. This is a sandbox chessboard.

    const handleSquareClick = (row: number, col: number) => {
        if (selectedPiece) {
            const [selectedRow, selectedCol] = selectedPiece;
            const piece = board[selectedRow][selectedCol];

            // A simple move logic, allowing any move
            const newBoard = board.map(r => [...r]);
            newBoard[row][col] = piece;
            newBoard[selectedRow][selectedCol] = null;
            setBoard(newBoard);
            setSelectedPiece(null);
            setIsWhiteTurn(!isWhiteTurn);
        } else {
            const piece = board[row][col];
            if (piece) {
                const isWhitePiece = piece === piece.toUpperCase();
                if ((isWhiteTurn && isWhitePiece) || (!isWhiteTurn && !isWhitePiece)) {
                    setSelectedPiece([row, col]);
                }
            }
        }
    };
    
    const handleNewGame = () => {
        setBoard(initialBoard);
        setIsWhiteTurn(true);
        setSelectedPiece(null);
    };

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col font-sans">
            <header className="flex-shrink-0 flex items-center justify-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <h1 className="text-xl font-bold text-[var(--theme-header-text)]">Chess Game</h1>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="flex justify-between w-full max-w-sm mb-4">
                    <div className={`p-2 rounded-lg transition-colors ${!isWhiteTurn ? 'bg-[var(--theme-primary)]/20' : ''}`}>
                        <span className="font-semibold text-[var(--theme-text)]">Black's Turn</span>
                    </div>
                    <div className={`p-2 rounded-lg transition-colors ${isWhiteTurn ? 'bg-[var(--theme-primary)]/20' : ''}`}>
                        <span className="font-semibold text-[var(--theme-text)]">White's Turn</span>
                    </div>
                </div>

                 <div className="text-center mb-4 text-sm text-[var(--theme-text-secondary)]">
                    <p>A simple board for two players. Move validation is not yet implemented.</p>
                </div>

                <div className="aspect-square w-full max-w-sm bg-gray-400 shadow-lg grid grid-cols-8">
                    {board.map((rowArr, r) =>
                        rowArr.map((piece, c) => {
                            const isWhiteSquare = (r + c) % 2 !== 0;
                            const isSelected = selectedPiece && selectedPiece[0] === r && selectedPiece[1] === c;
                            return (
                                <motion.div
                                    key={`${r}-${c}`}
                                    onClick={() => handleSquareClick(r, c)}
                                    className={`aspect-square flex items-center justify-center cursor-pointer ${isWhiteSquare ? 'bg-gray-200' : 'bg-gray-500'} ${isSelected ? 'ring-2 ring-inset ring-yellow-400' : ''}`}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {piece && (
                                        <span className={`text-4xl md:text-5xl select-none ${piece === piece.toUpperCase() ? 'text-white' : 'text-black'}`} style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>
                                            {PIECES[piece as keyof typeof PIECES]}
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>

                <button
                    onClick={handleNewGame}
                    className="mt-6 px-6 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold rounded-lg shadow-md hover:bg-[var(--theme-primary-hover)] transition-colors"
                >
                    New Game
                </button>
            </main>
        </div>
    );
};

export default ChessPage;