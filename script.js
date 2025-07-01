const gameState = {
    currentPhase: 'setup',
    round: 0,
    maxRounds: 50,
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

// DOM Elements
const player1Grid = document.getElementById('player1Grid');
const player2Grid = document.getElementById('player2Grid');
const player1Submit = document.getElementById('player1Submit');
const player2Submit = document.getElementById('player2Submit');
const setupPhase = document.querySelector('.setup-phase');
const gamePhase = document.getElementById('gamePhase');
const player1GameGrid = document.getElementById('player1GameGrid');
const player2GameGrid = document.getElementById('player2GameGrid');
const scoreTable = document.getElementById('scoreTable').querySelector('tbody');
const finalResults = document.getElementById('finalResults');
const resultsText = document.getElementById('resultsText');

// ✅ Live Message Box Updater
function updateMessage(text) {
    document.getElementById('liveMessage').textContent = text;
}

// === SETUP ===
function createSetupGrid(gridElement, playerNum) {
    gridElement.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (i === 0) {
            cell.classList.add('empty');
        } else {
            cell.addEventListener('click', () => {
                const player = gameState[`player${playerNum}`];
                if (player.grid[i] === null && player.nextNumber <= 15) {
                    player.grid[i] = player.nextNumber;
                    cell.textContent = player.nextNumber;
                    cell.classList.add('selected');
                    updateMessage(`Player ${playerNum}: Placed number ${player.nextNumber}`);
                    player.nextNumber++;
                }
            });
        }
        gridElement.appendChild(cell);
    }
}

function validateGrid(playerNum) {
    const grid = gameState[`player${playerNum}`].grid;
    const numbers = grid.filter(v => v !== null);
    return numbers.length === 15 && Math.min(...numbers) === 1 && Math.max(...numbers) === 15;
}

player1Submit.onclick = () => {
    if (validateGrid(1)) {
        player1Submit.disabled = true;
        updateMessage("Player 1 grid locked! Now Player 2 can submit.");
        if (player2Submit.disabled) startGame();
    } else {
        alert("Fill numbers 1–15 exactly once.");
    }
};

player2Submit.onclick = () => {
    if (validateGrid(2)) {
        player2Submit.disabled = true;
        updateMessage("Both players have submitted. Game starting...");
        if (player1Submit.disabled) startGame();
    } else {
        alert("Fill numbers 1–15 exactly once.");
    }
};

// === GAME ===
function startGame() {
    gamePhase.classList.remove('hidden');
    createGameGrid(player1GameGrid, 1);
    createGameGrid(player2GameGrid, 2);
    startNextRound();
}

function createGameGrid(gridElement, playerNum) {
    const player = gameState[`player${playerNum}`];
    gridElement.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (i === 0) {
            cell.classList.add('empty');
        } else {
            cell.textContent = player.grid[i] || '';
        }
        gridElement.appendChild(cell);
    }
}

function updateGameGrid(grid, playerNum) {
    const player = gameState[`player${playerNum}`];
    const cells = grid.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
        cell.className = 'cell';
        if (i === 0) cell.classList.add('empty');
        if (player.visited.has(i)) cell.classList.add('visited');
        if (i === player.currentPosition) cell.classList.add('selected');
        cell.textContent = player.grid[i] || '';
        cell.onclick = null;
    });
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

let turnState = {
    player1Ready: false,
    player2Ready: false
};

function setupMoveSelection(playerNum, grid) {
    const player = gameState[`player${playerNum}`];
    const validMoves = getAdjacent(player.currentPosition).filter(i => !player.visited.has(i));
    const cells = grid.querySelectorAll('.cell');

    if (validMoves.length === 0) {
        player.lastValue = null;
        markTurnReady(playerNum);
        return;
    }

    validMoves.forEach(i => {
        cells[i].classList.add('possible-move');
        cells[i].onclick = () => {
            player.currentPosition = i;
            player.visited.add(i);
            player.lastValue = player.grid[i];
            updateGameGrid(grid, playerNum);
            markTurnReady(playerNum);
        };
    });
}

function markTurnReady(playerNum) {
    turnState[`player${playerNum}Ready`] = true;
    if (turnState.player1Ready && turnState.player2Ready) {
        checkAndCompare();
        setTimeout(startNextRound, 500);
    }
}

function startNextRound() {
    gameState.round++;
    if (gameState.round > gameState.maxRounds) return endGame();

    turnState.player1Ready = false;
    turnState.player2Ready = false;

    updateMessage(`Round ${gameState.round}: Both players, choose your next move.`);
    updateGameGrid(player1GameGrid, 1);
    updateGameGrid(player2GameGrid, 2);

    const p1Moves = getAdjacent(gameState.player1.currentPosition).filter(i => !gameState.player1.visited.has(i));
    const p2Moves = getAdjacent(gameState.player2.currentPosition).filter(i => !gameState.player2.visited.has(i));

    if (p1Moves.length > 0) {
        setupMoveSelection(1, player1GameGrid);
    } else {
        gameState.player1.lastValue = null;
        turnState.player1Ready = true;
    }

    if (p2Moves.length > 0) {
        setupMoveSelection(2, player2GameGrid);
    } else {
        gameState.player2.lastValue = null;
        turnState.player2Ready = true;
    }

    // If both players stuck, end game
    if (turnState.player1Ready && turnState.player2Ready && p1Moves.length === 0 && p2Moves.length === 0) {
        checkAndCompare();
        return endGame();
    }
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
    scoreTable.innerHTML = '';
    for (const r of gameState.rounds) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.round}</td>
            <td>${r.player1}</td>
            <td>${r.player2}</td>
            <td>${r.winner}</td>
        `;
        scoreTable.appendChild(tr);
    }
}

function endGame() {
    const p1 = gameState.player1.score;
    const p2 = gameState.player2.score;
    const draws = gameState.rounds.filter(r => r.winner === 'Draw').length;

    let resultText =
        p1 > p2 ? `🎉 Player 1 wins ${p1}–${p2} with ${draws} draws.` :
        p2 > p1 ? `🎉 Player 2 wins ${p2}–${p1} with ${draws} draws.` :
        `🤝 It's a tie! ${p1} each with ${draws} draws.`;

    resultsText.textContent = resultText;
    finalResults.classList.remove('hidden');
    updateMessage("Game over! See final results below.");
}

// Init
window.onload = () => {
    createSetupGrid(player1Grid, 1);
    createSetupGrid(player2Grid, 2);
};
document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
});

function toggleRules() {
    const popup = document.getElementById('rulesPopup');
    popup.classList.toggle('hidden');
}

// ✅ Close popup if clicked outside
window.addEventListener('click', function(e) {
    const popup = document.getElementById('rulesPopup');
    const button = document.getElementById('rulesBtn');
    if (!popup.contains(e.target) && !button.contains(e.target)) {
        popup.classList.add('hidden');
    }
});

// ✅ Ensure everything loads correctly
document.addEventListener('DOMContentLoaded', () => {
    createSetupGrid(player1Grid, 1);
    createSetupGrid(player2Grid, 2);

    document.getElementById('restartBtn').addEventListener('click', () => {
        location.reload();
    });

    document.getElementById('rulesBtn').addEventListener('click', toggleRules);
});