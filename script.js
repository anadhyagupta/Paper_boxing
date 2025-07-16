const gameState = {
    currentPhase: 'setup',
    currentPlayer: 1,
    round: 0,
    maxRounds: 15,
    player1: {
        grid: Array(16).fill(null),
        visited: new Set([0]),
        currentPosition: 0,
        score: 0,
        lastValue: null,
        nextNumber: 1
    },
    player2: {
        grid: Array(16).fill(null),
        visited: new Set([0]),
        currentPosition: 0,
        score: 0,
        lastValue: null,
        nextNumber: 1
    },
    rounds: []
};

const elements = {
    liveMessage: document.getElementById('liveMessage'),
    currentPlayerBoard: document.getElementById('currentPlayerBoard'),
    currentPlayerGrid: document.getElementById('currentPlayerGrid'),
    submitNumbers: document.getElementById('submitNumbers'),
    gamePhase: document.getElementById('gamePhase'),
    currentGameBoard: document.getElementById('currentGameBoard'),
    currentGameGrid: document.getElementById('currentGameGrid'),
    currentGamePlayerTitle: document.getElementById('currentGamePlayerTitle'),
    turnIndicator: document.getElementById('turnIndicator'),
    currentRound: document.getElementById('currentRound'),
    scoreTable: document.getElementById('scoreTable').querySelector('tbody'),
    finalResults: document.getElementById('finalResults'),
    resultsText: document.getElementById('resultsText'),
    restartBtn: document.getElementById('restartBtn'),
    rulesBtn: document.getElementById('rulesBtn'),
    rulesPopup: document.getElementById('rulesPopup')
};

function initGame() {
    showPlayerSetup(1);

    elements.submitNumbers.addEventListener('click', handleSubmit);
    elements.restartBtn.addEventListener('click', () => location.reload());
    elements.rulesBtn.addEventListener('click', toggleRules);
    document.querySelector('.close-btn').addEventListener('click', toggleRules);

    updateMessage("Player 1, start placing numbers (1–15) on your grid.");
}

function showPlayerSetup(playerNum) {
    gameState.currentPlayer = playerNum;
    elements.currentPlayerBoard.className = `player-board player${playerNum}-board`;
    elements.currentPlayerBoard.querySelector('.player-title').textContent =
        `Player ${playerNum}: Fill your grid below:`;
    createSetupGrid(playerNum);
}

function createSetupGrid(playerNum) {
    elements.currentPlayerGrid.innerHTML = '';
    const player = gameState[`player${playerNum}`];

    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        if (i === 0) {
            cell.classList.add('empty');
        } else {
            cell.addEventListener('click', () => handleCellClick(cell, i, playerNum));
            if (player.grid[i] !== null) {
                cell.textContent = player.grid[i];
                cell.classList.add('selected');
            }
        }

        elements.currentPlayerGrid.appendChild(cell);
    }
}

function handleCellClick(cell, index, playerNum) {
    const player = gameState[`player${playerNum}`];

    if (player.grid[index] === null && player.nextNumber <= 15) {
        player.grid[index] = player.nextNumber;
        cell.textContent = player.nextNumber;
        cell.classList.add('selected');
        updateMessage(`Player ${playerNum}: Placed number ${player.nextNumber}`);
        player.nextNumber++;
    }
}

function handleSubmit() {
    const playerNum = gameState.currentPlayer;
    const player = gameState[`player${playerNum}`];
    const numbers = player.grid.filter(v => v !== null);
    const uniqueNumbers = new Set(numbers);

    if (numbers.length === 15 && uniqueNumbers.size === 15) {
        if (playerNum === 1) {
            showPlayerSetup(2);
            updateMessage("Player 2, now place your numbers (1–15) on your grid.");
        } else {
            startGame();
        }
    } else {
        alert("Please fill numbers 1–15 exactly once with no duplicates.");
    }
}

function startGame() {
    gameState.currentPhase = 'game';
    elements.currentPlayerBoard.classList.add('hidden');
    elements.gamePhase.classList.remove('hidden');
    startNextRound();
}

function startNextRound() {
    gameState.round++;
    if (gameState.round > gameState.maxRounds) return endGame();

    elements.currentRound.textContent = gameState.round;

    gameState.player1.lastValue = null;
    gameState.player2.lastValue = null;

    gameState.currentPlayer = 1;
    showCurrentPlayerTurn();
}

function showCurrentPlayerTurn() {
    const playerNum = gameState.currentPlayer;
    const player = gameState[`player${playerNum}`];

    elements.currentGameBoard.className = `player-board player${playerNum}-board`;
    elements.currentGamePlayerTitle.textContent = `Player ${playerNum}`;
    elements.turnIndicator.textContent = `Player ${playerNum}'s turn`;
    updateMessage(`Player ${playerNum}, select your next move.`);

    createGameGrid(playerNum);

    const validMoves = getValidMoves(playerNum);
    if (validMoves.length === 0) {
        player.lastValue = null;
        switchPlayerTurn();
    } else {
        setupMoveSelection(playerNum, validMoves);
    }
}

function createGameGrid(playerNum) {
    elements.currentGameGrid.innerHTML = '';
    const player = gameState[`player${playerNum}`];

    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        if (i === 0) {
            cell.classList.add('empty');
        } else {
            cell.textContent = player.grid[i] || '';
            if (player.visited.has(i)) {
                cell.classList.add('visited');
            }
            if (i === player.currentPosition) {
                cell.classList.add('selected');
            }
        }

        elements.currentGameGrid.appendChild(cell);
    }
}

function getValidMoves(playerNum) {
    const player = gameState[`player${playerNum}`];
    const adj = getAdjacent(player.currentPosition);
    return adj.filter(i => !player.visited.has(i));
}

function getAdjacent(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const adj = [];

    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            const i = r * 4 + c;
            if (r >= 0 && r < 4 && c >= 0 && c < 4 && i !== index) {
                adj.push(i);
            }
        }
    }
    return adj;
}

function setupMoveSelection(playerNum, validMoves) {
    const player = gameState[`player${playerNum}`];
    const cells = elements.currentGameGrid.querySelectorAll('.cell');

    validMoves.forEach(i => {
        cells[i].classList.add('possible-move');
        cells[i].onclick = () => {
            player.currentPosition = i;
            player.visited.add(i);
            player.lastValue = player.grid[i];
            switchPlayerTurn();
        };
    });
}

function switchPlayerTurn() {
    if (gameState.currentPlayer === 1) {
        gameState.currentPlayer = 2;
    } else {
        gameState.currentPlayer = 1;
        checkAndCompare();
        setTimeout(startNextRound, 0);
        return;
    }
    showCurrentPlayerTurn();
}

function checkAndCompare() {
    const p1 = gameState.player1;
    const p2 = gameState.player2;
    const v1 = p1.lastValue;
    const v2 = p2.lastValue;

    let winner;
    if (v1 !== null && v2 !== null) {
        if (v1 > v2) {
            p1.score++;
            winner = 'Player 1';
        } else if (v2 > v1) {
            p2.score++;
            winner = 'Player 2';
        } else {
            winner = 'Draw';
        }
    } else if (v1 !== null) {
        p1.score++;
        winner = 'Player 1';
    } else if (v2 !== null) {
        p2.score++;
        winner = 'Player 2';
    } else {
        winner = 'Draw';
    }

    gameState.rounds.push({
        round: gameState.round,
        player1: v1 !== null ? v1 : 'X',
        player2: v2 !== null ? v2 : 'X',
        winner
    });

    updateScoreboard();
}

function updateScoreboard() {
    elements.scoreTable.innerHTML = '';
    gameState.rounds.forEach(round => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${round.round}</td>
      <td>${round.player1}</td>
      <td>${round.player2}</td>
      <td>${round.winner}</td>
    `;
        elements.scoreTable.appendChild(tr);
    });
}

function endGame() {
    const p1 = gameState.player1;
    const p2 = gameState.player2;
    const draws = gameState.rounds.filter(r => r.winner === 'Draw').length;

    let resultText;
    if (p1.score > p2.score) {
        resultText = `🎉 Player 1 wins ${p1.score}–${p2.score} with ${draws} draws!`;
    } else if (p2.score > p1.score) {
        resultText = `🎉 Player 2 wins ${p2.score}–${p1.score} with ${draws} draws!`;
    } else {
        resultText = `🤝 It's a tie! ${p1.score} each with ${draws} draws.`;
    }

    elements.resultsText.innerHTML = resultText;
    elements.finalResults.classList.remove('hidden');
    updateMessage("Game over! See final results below.");
}

function updateMessage(text) {
    elements.liveMessage.textContent = text;
}

function toggleRules() {
    elements.rulesPopup.classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', initGame);