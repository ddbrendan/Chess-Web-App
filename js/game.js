class ChessGame {
    constructor() {
        this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.initializeBoard();
        this.positionHistory = [];
        this.currentMove = 0;
        this.savePosition();
    }

    initializeBoard() {
        const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        this.board[7] = backRow.map(piece => ({ type: piece, color: 'black', hasMoved: false }));
        this.board[6] = Array(8).fill(null).map(() => ({ type: 'p', color: 'black', hasMoved: false }));
        this.board[1] = Array(8).fill(null).map(() => ({ type: 'p', color: 'white', hasMoved: false }));
        this.board[0] = backRow.map(piece => ({ type: piece, color: 'white', hasMoved: false }));

        for (let row = 2; row < 6; row++) {
            this.board[row] = new Array(8).fill(null);
        }
    }

    isValidMove(startPos, endPos) {
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
        
        const piece = this.board[startRow][startCol];
        if (!piece || piece.color !== this.currentPlayer) return false;

        const targetPiece = this.board[endRow][endCol];
        if (targetPiece && targetPiece.color === piece.color) return false;

        const rowDiff = endRow - startRow;
        const colDiff = endCol - startCol;

        //piece movement rules
        switch (piece.type) {
            case 'p': //pawn
                const direction = piece.color === 'white' ? 1 : -1;
                const startRank = piece.color === 'white' ? 1 : 6;

                //normal move
                if (colDiff === 0 && rowDiff === direction && !targetPiece) {
                    return true;
                }
                //two square move
                if (colDiff === 0 && startRow === startRank && rowDiff === 2 * direction && 
                    !targetPiece && !this.board[startRow + direction][startCol]) {
                    return true;
                }
                //capture
                if (Math.abs(colDiff) === 1 && rowDiff === direction && targetPiece) {
                    return true;
                }
                return false;

            case 'r': //rook
                return this.isValidStraightMove(startPos, endPos);

            case 'n': //knight
                return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
                       (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);

            case 'b': //bishiop
                return this.isValidDiagonalMove(startPos, endPos);

            case 'q': //queen
                return this.isValidStraightMove(startPos, endPos) ||
                       this.isValidDiagonalMove(startPos, endPos);

            case 'k': //king
                if (this.canCastle(startPos, endPos)) {
                    return true;
                }
            return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;        }
        return false;
    }

    isValidStraightMove(startPos, endPos) {
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
        
        if (startRow !== endRow && startCol !== endCol) return false;
        
        const rowDir = Math.sign(endRow - startRow);
        const colDir = Math.sign(endCol - startCol);
        let currentRow = startRow + rowDir;
        let currentCol = startCol + colDir;

        while (currentRow !== endRow || currentCol !== endCol) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowDir;
            currentCol += colDir;
        }
        return true;
    }

    isValidDiagonalMove(startPos, endPos) {
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
        
        if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) return false;
        
        const rowDir = Math.sign(endRow - startRow);
        const colDir = Math.sign(endCol - startCol);
        let currentRow = startRow + rowDir;
        let currentCol = startCol + colDir;

        while (currentRow !== endRow) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowDir;
            currentCol += colDir;
        }
        return true;
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'k' && piece.color === color) {
                    return [row, col];
                }
            }
        }
    }

    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        
        const opponentColor = color === 'white' ? 'black' : 'white';
        const originalCurrentPlayer = this.currentPlayer;
        this.currentPlayer = opponentColor;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.isValidMove([row, col], kingPos)) {
                        this.currentPlayer = originalCurrentPlayer;
                        return true;
                    }
                }
            }
        }
        
        this.currentPlayer = originalCurrentPlayer;
        return false;
    }

    makeMove(startPos, endPos) {
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
        const piece = this.board[startRow][startCol];
    
        if (!this.isValidMove(startPos, endPos)) {
            return false;
        }
    
        // Handle castling
        if (piece.type === 'k' && Math.abs(endCol - startCol) === 2) {
            const rookCol = endCol > startCol ? 7 : 0;
            const newRookCol = endCol > startCol ? endCol - 1 : endCol + 1;
            const rook = this.board[startRow][rookCol];
            
            // Move rook
            this.board[startRow][newRookCol] = rook;
            this.board[startRow][rookCol] = null;
            rook.hasMoved = true;
        }
    
        // Store state
        const capturedPiece = this.board[endRow][endCol];
        
        // Make the move
        this.board[endRow][endCol] = piece;
        this.board[startRow][startCol] = null;
        piece.hasMoved = true;
    
        // Check if move puts/leaves king in check
        if (this.isInCheck(this.currentPlayer)) {
            // Undo the move
            this.board[startRow][startCol] = piece;
            this.board[endRow][endCol] = capturedPiece;
            piece.hasMoved = false;
            return false;
        }
    
        // Handle pawn promotion
        if (piece.type === 'p' && (endRow === 7 || endRow === 0)) {
            return {
                needsPromotion: true,
                callback: (promotionPiece) => {
                    this.board[endRow][endCol] = {
                        type: promotionPiece,
                        color: piece.color,
                        hasMoved: true
                    };
                    this.finishMove(startPos, endPos, piece, capturedPiece);
                }
            };
        }
    
        return this.finishMove(startPos, endPos, piece, capturedPiece);
    }
    
    finishMove(startPos, endPos, piece, capturedPiece) {
        if (capturedPiece) {
            this.capturedPieces[this.currentPlayer].push(capturedPiece);
        }
    
        this.moveHistory = this.moveHistory.slice(0, this.currentMove);
        this.positionHistory = this.positionHistory.slice(0, this.currentMove + 1);
    
        this.moveHistory.push({
            piece: piece,
            from: startPos,
            to: endPos,
            captured: capturedPiece
        });
    
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.currentMove++;
        this.savePosition();
        return true;
    }

    isCheckmate() {
        if (!this.isInCheck(this.currentPlayer)) return false;

        //try every possible move for current player
        for (let startRow = 0; startRow < 8; startRow++) {
            for (let startCol = 0; startCol < 8; startCol++) {
                const piece = this.board[startRow][startCol];
                if (piece && piece.color === this.currentPlayer) {
                    for (let endRow = 0; endRow < 8; endRow++) {
                        for (let endCol = 0; endCol < 8; endCol++) {
                            if (this.isValidMove([startRow, startCol], [endRow, endCol])) {
                                //try move
                                const originalEndPiece = this.board[endRow][endCol];
                                this.board[endRow][endCol] = piece;
                                this.board[startRow][startCol] = null;

                                const stillInCheck = this.isInCheck(this.currentPlayer);

                                //undo move
                                this.board[startRow][startCol] = piece;
                                this.board[endRow][endCol] = originalEndPiece;

                                if (!stillInCheck) return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    
    savePosition() {
        // Deep copy the current board
        const boardCopy = this.board.map(row => 
            row.map(piece => piece ? {...piece} : null)
        );
        this.positionHistory[this.currentMove] = {
            board: boardCopy,
            currentPlayer: this.currentPlayer,
            capturedPieces: {
                white: [...this.capturedPieces.white],
                black: [...this.capturedPieces.black]
            }
        };
    }

    goToMove(moveNumber) {
        if (moveNumber < 0 || moveNumber > this.positionHistory.length - 1) return false;
    
        const position = this.positionHistory[moveNumber];
        this.board = position.board.map(row => 
            row.map(piece => piece ? {...piece} : null)
        );
        this.currentPlayer = position.currentPlayer;
        this.capturedPieces = {
            white: [...position.capturedPieces.white],
            black: [...position.capturedPieces.black]
        };
        this.currentMove = moveNumber;
        
        return true;
    }

    canCastle(startPos, endPos) {
        const [startRow, startCol] = startPos;
        const [endRow, endCol] = endPos;
        const piece = this.board[startRow][startCol];
        
        // Must be king's first move
        if (piece.type !== 'k' || piece.hasMoved) return false;
        
        // Must be a two-square horizontal move
        if (startRow !== endRow || Math.abs(endCol - startCol) !== 2) return false;
        
        const rookCol = endCol > startCol ? 7 : 0;
        const rook = this.board[startRow][rookCol];
        
        // Check if rook exists and hasn't moved
        if (!rook || rook.type !== 'r' || rook.hasMoved) return false;
        
        // Check if path is clear
        const direction = Math.sign(endCol - startCol);
        let currentCol = startCol + direction;
        const endRookCol = direction > 0 ? endCol - 1 : endCol + 1;
        
        while (currentCol !== endRookCol) {
            if (this.board[startRow][currentCol]) return false;
            currentCol += direction;
        }
        
        // Check if king passes through check
        let checkCol = startCol;
        while (checkCol !== endCol) {
            if (this.isSquareUnderAttack([startRow, checkCol], piece.color)) return false;
            checkCol += direction;
        }
        
        return true;
    }
    
    isSquareUnderAttack(pos, color) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        const originalCurrentPlayer = this.currentPlayer;
        this.currentPlayer = opponentColor;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.isValidMove([row, col], pos)) {
                        this.currentPlayer = originalCurrentPlayer;
                        return true;
                    }
                }
            }
        }
        
        this.currentPlayer = originalCurrentPlayer;
        return false;
    }

}

