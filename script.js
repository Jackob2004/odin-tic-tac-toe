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
     * @returns {boolean} returns true if cell wasn't already occupied
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

    const startNewGame = (firstPlayerName, secondPlayerName) => {
        players.length = 0;
        activePlayer = 0;

        const firstPlayer = createPlayer("x", firstPlayerName);
        const secondPlayer = createPlayer("o", secondPlayerName);
        players.push(firstPlayer);
        players.push(secondPlayer);

        gameState = States.RUNNING;
    };

    const playRound = () => {

    };

    const makeTurn = (cellIndex) => {
    };

    function createPlayer(playerSymbol, name) {
        let gamesWon = 0;

        const win = () => gamesWon++;
        const getWonGames = () => gamesWon;

        return {getWonGames, win, playerSymbol, name};
    }

    return {};
})();
