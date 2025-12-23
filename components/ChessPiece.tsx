
import React from 'react';
import { Color, PieceSymbol } from '../types';

interface PieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
}

const ChessPiece: React.FC<PieceProps> = ({ type, color, className = "" }) => {
  const isWhite = color === 'w';
  const fillColor = isWhite ? "#ffffff" : "#444444";
  const strokeColor = "#000000";

  const renderNeoPiece = () => {
    switch (type) {
      case 'p':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round">
            <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
          </g>
        );
      case 'n':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10c10.5 1 16.5 8 16 18l-4-2c1-3-1-5-1-5 0 0 1 4-2 6-3 2-7 4-7 4 0 0 4 0 4 4 0 4-7 5-7 5l-11 0l0-4c0 0 11 0 11-5c0-5-8-7-8-21c0 0 0-3 9 0z" />
            <path d="M24 18c.32 0 .62.14.82.38l1.36 1.62c.2.24.3.54.28.84l-.06.6c-.02.3-.12.58-.32.82l-1.36 1.62a1.1 1.1 0 0 1-1.64 0l-1.36-1.62a1.1 1.1 0 0 1-.32-.82l-.06-.6a1.1 1.1 0 0 1 .28-.84l1.36-1.62c.2-.24.5-.38.82-.38z" fill={isWhite ? strokeColor : fillColor} stroke="none" />
          </g>
        );
      case 'b':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 0 5-22.5 5 0 0 0-5 0-5z" />
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
            <path d="M17.5 26h10M15 30h15" fill="none" stroke={strokeColor} />
          </g>
        );
      case 'r':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
            <path d="M34 14l-3 3H14l-3-3M31 17v12.5H14V17M31 29.5l1.5 2.5h-20l1.5-2.5" />
          </g>
        );
      case 'q':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM11 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM38 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-5.5-13.5V25L13 14l2 12z" />
            <path d="M9 26c0 2 1.5 2 2.5 4 2.5 2.5 12.5 2.5 15 0 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-20 0z" />
            <path d="M9 39h27v-3H9v3z" />
          </g>
        );
      case 'k':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" fill="none" stroke={strokeColor} />
            <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
            <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s-9-4.5-10.5-4.5C20.5 25.5 11.5 30 11.5 30v7z" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg 
      viewBox="0 0 45 45" 
      className={`w-full h-full drop-shadow-md transition-transform hover:scale-110 cursor-grab active:cursor-grabbing ${className}`}
    >
      {renderNeoPiece()}
    </svg>
  );
};

export default ChessPiece;
