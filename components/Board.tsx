
import React, { useState, useEffect, useRef } from 'react';
import ChessPiece from './ChessPiece';
import { Color, PieceSymbol, Arrow, Highlight } from '../types';

declare const Chess: any;

interface BoardProps {
  game: any;
  onMove: (move: { from: string, to: string, promotion: string }) => void;
  lastMove?: { from: string, to: string } | null;
  arrows?: Arrow[];
  highlights?: Highlight[];
  isEditable?: boolean;
  onDrawArrow?: (arrow: Arrow) => void;
  onToggleHighlight?: (square: string) => void;
  onClearAnnotations?: () => void;
}

const Board: React.FC<BoardProps> = ({ 
  game, 
  onMove, 
  lastMove, 
  arrows = [], 
  highlights = [], 
  isEditable = false,
  onDrawArrow,
  onToggleHighlight
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const board = game.board();

  const handleMouseDown = (e: React.MouseEvent, square: string) => {
    if (e.button === 2) { // Right click
      setDragStart(square);
      e.preventDefault();
    }
  };

  const handleMouseUp = (e: React.MouseEvent, square: string) => {
    if (e.button === 2 && dragStart) {
      if (dragStart === square) {
        onToggleHighlight?.(square);
      } else {
        onDrawArrow?.({ from: dragStart, to: square, color: '#f59e0b' });
      }
      setDragStart(null);
    }
  };

  const handleSquareClick = (square: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; 

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    const piece = game.get(square);
    if (piece && (isEditable || piece.color === game.turn())) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }).map((m: any) => m.to);
      setLegalMoves(moves);
      return;
    }

    if (selectedSquare) {
      if (legalMoves.includes(square) || isEditable) {
        onMove({ from: selectedSquare, to: square, promotion: 'q' });
        setSelectedSquare(null);
        setLegalMoves([]);
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    }
  };

  const getArrowCoords = (arrow: Arrow) => {
    const fCol = arrow.from.charCodeAt(0) - 97;
    const fRow = 8 - parseInt(arrow.from[1]);
    const tCol = arrow.to.charCodeAt(0) - 97;
    const tRow = 8 - parseInt(arrow.to[1]);

    const unit = 100 / 8;
    const x1 = fCol * unit + unit / 2;
    const y1 = fRow * unit + unit / 2;
    const x2 = tCol * unit + unit / 2;
    const y2 = tRow * unit + unit / 2;

    return { x1, y1, x2, y2 };
  };

  return (
    <div 
      ref={boardRef}
      className="relative w-full max-w-[600px] aspect-square shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden select-none rounded-sm bg-[#312e2b]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 flex flex-col">
        {board.map((row: any[], i: number) => (
          <div key={i} className="flex flex-1">
            {row.map((piece: any, j: number) => {
              const square = `${String.fromCharCode(97 + j)}${8 - i}`;
              const isDark = (i + j) % 2 === 1;
              const isSelected = selectedSquare === square;
              const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
              const isLegalTarget = legalMoves.includes(square);
              const highlight = highlights.find(h => h.square === square);

              // Chess.com standard colors
              const squareBg = isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]';
              const textClass = isDark ? 'text-[#eeeed2]' : 'text-[#769656]';

              return (
                <div
                  key={square}
                  onMouseDown={(e) => handleMouseDown(e, square)}
                  onMouseUp={(e) => handleMouseUp(e, square)}
                  onClick={(e) => handleSquareClick(square, e)}
                  className={`
                    relative flex-1 flex items-center justify-center cursor-pointer
                    ${squareBg}
                    ${isSelected ? 'after:absolute after:inset-0 after:bg-[#f6f669]/60' : ''}
                    ${isLastMove ? 'after:absolute after:inset-0 after:bg-[#f6f669]/60' : ''}
                    ${highlight ? 'after:absolute after:inset-0 after:bg-red-500/50' : ''}
                  `}
                >
                  {/* Chess.com style corner coordinates */}
                  {j === 0 && (
                    <span className={`absolute left-[2%] top-[2%] text-[clamp(8px,1.5vw,12px)] font-bold pointer-events-none ${textClass}`}>
                      {8 - i}
                    </span>
                  )}
                  {i === 7 && (
                    <span className={`absolute right-[2%] bottom-[2%] text-[clamp(8px,1.5vw,12px)] font-bold pointer-events-none ${textClass}`}>
                      {String.fromCharCode(97 + j)}
                    </span>
                  )}

                  {isLegalTarget && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      {piece ? (
                        <div className="w-[85%] h-[85%] rounded-full border-[clamp(2px,0.5vw,6px)] border-black/10"></div>
                      ) : (
                        <div className="w-[20%] h-[20%] rounded-full bg-black/15"></div>
                      )}
                    </div>
                  )}

                  {piece && (
                    <div className="w-[95%] h-[95%] z-10 flex items-center justify-center">
                      <ChessPiece type={piece.type} color={piece.color} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <svg className="absolute inset-0 pointer-events-none z-30 opacity-80" viewBox="0 0 100 100">
        <defs>
          <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orientation="auto">
            <polygon points="0 0, 4 2, 0 4" fill="#f59e0b" />
          </marker>
        </defs>
        {arrows.map((arrow, idx) => {
          const coords = getArrowCoords(arrow);
          return (
            <line 
              key={idx}
              x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2}
              stroke="#f59e0b"
              strokeWidth="2.5"
              markerEnd="url(#arrowhead)"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default Board;
