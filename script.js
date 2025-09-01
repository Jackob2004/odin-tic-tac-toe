const gameboard = (function () {
    const boardState = new Array(9).fill(null);
    // signalizes tie
    let takenCells= 0;
    // indexes to check
    const winningCombinations = [
        // horizontal
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        // vertical
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        // diagonal
        [0, 4, 8], [6, 4, 2]
    ];

    /**
     *
     * @param {number} cellIndex
     * @param {string} playerSymbol
     * @returns {boolean} true if cell wasn't already occupied
     * @throws {RangeError} on marking index out of array bounds
     *
     */
    const markSpace = (cellIndex, playerSymbol) => {
        if (cellIndex < 0 || cellIndex > boardState.length - 1) {
            throw new RangeError("Invalid cell index");
        }

        if (boardState[cellIndex] !== null) {
            return false;
        }

        boardState[cellIndex] = playerSymbol;
        takenCells++;

        return true;
    };

    /**
     *
     * @param {array.<number>} combination array of indices forming a combination
     * @returns {boolean} true if combination is complete
     */
    const checkSingleCombination = (combination) => {
        const playerSymbol = boardState[combination[0]];
        if (playerSymbol === null) return false;

        for (let i = 1; i < combination.length; i++) {
            if (playerSymbol !== boardState[combination[i]]) {
                return false;
            }
        }

        return true;
    };

    /**
     *
     * @returns {boolean} true if any combination is complete
     */
    const isAnyRowComplete = () => {
        if (takenCells < 3) return false;

        for (let i = 0; i < winningCombinations.length; i++) {
            if (checkSingleCombination(winningCombinations[i])) {
                return true;
            }
        }

        return false;
    };

    /**
     *
     * @returns {boolean} false signalizes that it might be a tie
     */
    const isAnySpaceLeft = () => takenCells < boardState.length;

    const resetBoard = () => {
        boardState.fill(null);
        takenCells = 0;
    };

    return {markSpace, isAnyRowComplete, isAnySpaceLeft, resetBoard};
})();

// module controlling game flow
const gameController = (function () {
    const States= Object.freeze({
        PREPARATION: Symbol("preparation"),
        RUNNING:  Symbol("running"),
        OVER_WON: Symbol("won"),
        OVER_TIE: Symbol("tie"),
    });

    let gameState = States.PREPARATION;

    const players = [];
    // points to player whose turn it currently is
    let activePlayer = 0;

    /**
     * starts a new round preserving players data
     */
    const playRound = () => {
        activePlayer = 0;
        gameState = States.RUNNING;
        gameboard.resetBoard();
    };

    /**
     * starts a completely new game with new players
     * @param {string} firstPlayerName
     * @param {string} secondPlayerName
     */
    const startNewGame = (firstPlayerName, secondPlayerName) => {
        players.length = 0;

        const firstPlayer = createPlayer("x", firstPlayerName);
        const secondPlayer = createPlayer("o", secondPlayerName);
        players.push(firstPlayer);
        players.push(secondPlayer);

        playRound();
    };

    const evaluateGameState = () => {
        if (gameboard.isAnyRowComplete()) {
            gameState = States.OVER_WON;
            players[activePlayer].win();
        } else if (!gameboard.isAnySpaceLeft()) {
            gameState = States.OVER_TIE;
        }
    };

    /**
     *
     * @param {number} cellIndex
     * @returns {string|null} null if game is over or space is occupied
                              otherwise symbol of a player who took this turn
     */
    const takeTurn = (cellIndex) => {
        if (gameState !== States.RUNNING) return null;

        const playerSymbol = players[activePlayer].playerSymbol;
        if (!gameboard.markSpace(cellIndex, playerSymbol)) return null;

        evaluateGameState();

        if (gameState === States.RUNNING) {
            activePlayer = (activePlayer === 0) ? 1 : 0;
        }

        return playerSymbol;
    };

    /**
     *
     * @param {string} playerSymbol player marking symbol
     * @param {string} name
     */
    function createPlayer(playerSymbol, name) {
        let gamesWon = 0;

        const win = () => gamesWon++;
        const getWonGames = () => gamesWon;

        return {getWonGames, win, playerSymbol, name};
    }

    return {startNewGame, takeTurn, playRound};
})();
