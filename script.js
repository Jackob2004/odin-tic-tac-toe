const gameboard = (function () {
    const boardState = new Array(9).fill(null);
    // signalizes tie
    let takenCells= 0;

    let winningCombination = null;
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
     * @returns {boolean} true if any combination is complete
     */
    const isAnyRowComplete = () => {
        if (takenCells < 3) return false;

        for (let i = 0; i < winningCombinations.length; i++) {
            if (checkSingleCombination(winningCombinations[i])) {
                winningCombination = winningCombinations[i];
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
        winningCombination = null;
    };

    /**
     *
     * @returns {array.<number>|null} null when no row is complete yet
     */
    const getWinningCombination = () => winningCombination;

    /**
     *
     * @param {array.<number>} combination array of indices forming a combination
     * @returns {boolean} true if combination is complete
     */
    function checkSingleCombination(combination) {
        const playerSymbol = boardState[combination[0]];
        if (playerSymbol === null) return false;

        for (let i = 1; i < combination.length; i++) {
            if (playerSymbol !== boardState[combination[i]]) {
                return false;
            }
        }

        return true;
    }

    return {markSpace, isAnyRowComplete, isAnySpaceLeft, getWinningCombination, resetBoard};
})();

// module controlling game flow
const gameController = (function (board) {
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
     * @throws {error} on calling function when game has not started and player profiles have not been initialized
     */
    const playRound = () => {
        if (players.length === 0) {
            throw new Error("Cannot play round: Game has not started");
        }
        activePlayer = 0;
        gameState = States.RUNNING;
        board.resetBoard();
    };

    /**
     * starts a completely new game with new players
     * @param {string} firstPlayerName - name of a player who will be recognized by 'x' symbol
     * @param {string} secondPlayerName - name of a player who will be recognized by 'o' symbol
     */
    const startNewGame = (firstPlayerName, secondPlayerName) => {
        players.length = 0;

        const firstPlayer = createPlayer("x", firstPlayerName);
        const secondPlayer = createPlayer("o", secondPlayerName);
        players.push(firstPlayer);
        players.push(secondPlayer);

        playRound();
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
        if (!board.markSpace(cellIndex, playerSymbol)) return null;

        evaluateGameState();

        if (gameState === States.RUNNING) {
            activePlayer = (activePlayer === 0) ? 1 : 0;
        }

        return playerSymbol;
    };

    /**
     * Gets data (name and games won) for both players.
     *
     * @returns {Object.<string, {name: string, gamesWon: number}>|null}
     *   player data mapped by symbol, or null if game is in preparation
     * @example { 'x': { name: 'Alice', gamesWon: 3 }, 'o': { name: 'Bob', gamesWon: 1 } }
     */
    const getPlayersData = () => {
        if (gameState === States.PREPARATION) return null;

        return {
            [players[0].playerSymbol]: {name: players[0].name, gamesWon: players[0].getWonGames()},
            [players[1].playerSymbol]: {name: players[1].name, gamesWon: players[1].getWonGames()},
        };
    };


    /**
     *
     * @returns {string|null} symbol of a player whose turn it is right now or null if game has not started
     */
    const getActivePlayerSymbol = () => {
        if (gameState === States.PREPARATION) return null;

        return players[activePlayer].playerSymbol;
    };

    function evaluateGameState() {
        if (board.isAnyRowComplete()) {
            gameState = States.OVER_WON;
            players[activePlayer].win();
            dispatchGameOverEvent()
        } else if (!board.isAnySpaceLeft()) {
            gameState = States.OVER_TIE;
            dispatchGameOverEvent()
        }
    }

    function dispatchGameOverEvent() {
        const event = new CustomEvent("game-over",{
            detail: {
                result: getGameResult(),
            },
        });

        document.body.dispatchEvent(event);
    }

    /**
     *
     * @returns {{message: string, winnerName: string, combination: array.<number>|null}|null}
                game result object or null if game is ongoing or has not started
     */
    function getGameResult() {
        let result = null;

        if (gameState === States.OVER_WON) {
            result = {
                message: "GAME OVER!",
                winnerName: players[activePlayer].name,
                combination: board.getWinningCombination()
            };
        } else if (gameState === States.OVER_TIE) {
            result = {
                message: "GAME TIE!",
                winnerName: "NO ONE!",
                combination: null
            };
        }

        return result;
    }

    /**
     *
     * @param {string} playerSymbol player marking symbol
     * @param {string} name
     */
    function createPlayer(playerSymbol, name) {
        let gamesWon = 0;

        const win = () => gamesWon++;
        /**
         *
         * @returns {number}
         */
        const getWonGames = () => gamesWon;

        return {getWonGames, win, playerSymbol, name};
    }

    return {startNewGame, takeTurn, playRound, getPlayersData, getActivePlayerSymbol};
})(gameboard);

// Module handling modal dialog which gets players data
(function (doc){
    const dialogWindow = doc.querySelector("dialog");
    const form = doc.querySelector("form");

    doc.querySelector("#start-btn").addEventListener("click", () => dialogWindow.showModal());

    doc.querySelector("#cancel-start-btn").addEventListener("click", () => {
        dialogWindow.close();
        form.reset();
    });

    doc.querySelector("form").addEventListener("submit", () => {
        const formData = new FormData(form);
        dispatchStartConfirmEvent(formData.get("first-player"), formData.get("second-player"));

        form.reset();
    });

    /**
     *
     * @param {string} firstPlayerName (x)
     * @param {string} secondPlayerName (o)
     */
    function dispatchStartConfirmEvent(firstPlayerName, secondPlayerName) {
        const event = new CustomEvent("start-confirm", {
            detail: {
                firstPlayer: firstPlayerName,
                secondPlayer: secondPlayerName,
            },
            bubbles: true,
        });

        dialogWindow.dispatchEvent(event);
    }

})(document);

// Module handing game UI
(function (doc, game){
    const cells = doc.querySelectorAll(".cell");
    const playAgainBtn = doc.querySelector("#play-again");

    const finalMessageDisplay = doc.querySelector("#final-message");
    const winnerNameDisplay = doc.querySelector("#winner-name");
    const turnIndicatorDisplay = doc.querySelector("#turn-symbol");

    const xPlayerNameDisplay = doc.querySelector("#x-name");
    const xPlayerGamesDisplay= doc.querySelector("#x-games");
    const oPlayerNameDisplay = doc.querySelector("#o-name");
    const oPlayerGamesDisplay= doc.querySelector("#o-games");

    doc.body.addEventListener("start-confirm", startGame);

    function resetGamePanel() {
        cells.forEach(cell => cell.replaceChildren());
        finalMessageDisplay.textContent = "";
        winnerNameDisplay.textContent = "";
    }

    function startGame(event) {
        game.startNewGame(event.detail.firstPlayer, event.detail.secondPlayer);
        resetGamePanel();
        playAgainBtn.disabled = false;

        xPlayerNameDisplay.textContent = event.detail.firstPlayer;
        oPlayerNameDisplay.textContent = event.detail.secondPlayer;

        xPlayerGamesDisplay.textContent = oPlayerGamesDisplay.textContent = "0";
        turnIndicatorDisplay.textContent = game.getActivePlayerSymbol();
    }




})(document, gameController);