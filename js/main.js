document.addEventListener('DOMContentLoaded', function() {
    const game = new ChessGame();
    const boardContainer = document.getElementById('chess-board');
    const ui = new ChessUI(game, boardContainer);
});