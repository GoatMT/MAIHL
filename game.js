const gameData = window.MAIHL_DATA;
const gameParams = new URLSearchParams(window.location.search);
const requestedGame = gameParams.get("id") || "1";
const game = gameData.games.find((item) => item.id === requestedGame) || gameData.games[0];

function getPlayer(key) {
  return gameData.players.find((player) => player.key === key);
}

function getPlayerName(key) {
  return getPlayer(key)?.fullName || key;
}

document.title = `${game.game} | MAIHL Game Center`;
document.querySelector("#game-date").textContent = game.date;
document.querySelector("#game-title").textContent = game.game;
document.querySelector("#player-one").textContent = getPlayerName(game.players[0]);
document.querySelector("#player-two").textContent = getPlayerName(game.players[1]);
document.querySelector("#game-winner").textContent = game.winner === "TBD" ? "TBD" : getPlayerName(game.winner);
document.querySelector("#goal-count").textContent = `${game.goals.length} ${game.goals.length === 1 ? "Goal" : "Goals"}`;

function getScoreForPlayer(playerName) {
  const scoreMatch = game.finalScore.match(/(.+?)\s+(\d+)\s+-\s+(\d+)\s+(.+)/);

  if (!scoreMatch) {
    return "0";
  }

  const firstPlayer = scoreMatch[1].trim();
  const firstScore = scoreMatch[2];
  const secondScore = scoreMatch[3];
  const secondPlayer = scoreMatch[4].trim();

  if (playerName === firstPlayer) {
    return firstScore;
  }

  if (playerName === secondPlayer) {
    return secondScore;
  }

  return "0";
}

document.querySelector("#player-one-score").textContent = getScoreForPlayer(game.players[0]);
document.querySelector("#player-two-score").textContent = getScoreForPlayer(game.players[1]);

if (game.players[0] === game.winner) {
  document.querySelector("#team-one-card").classList.add("is-winner");
}

if (game.players[1] === game.winner) {
  document.querySelector("#team-two-card").classList.add("is-winner");
}

function makeGameStatRow(left, label, right) {
  return `
    <div class="game-stat-row">
      <strong>${left}</strong>
      <span>${label}</span>
      <strong>${right}</strong>
    </div>
  `;
}

function getPredictionChance(leftPlayer, rightPlayer) {
  const leftOverall = Number(leftPlayer.overall) || 70;
  const rightOverall = Number(rightPlayer.overall) || 70;
  const rightChance = Math.min(70, Math.max(30, 50 + (rightOverall - leftOverall) * 2));
  return {
    left: 100 - rightChance,
    right: rightChance
  };
}

function renderGameStats() {
  const statBoard = document.querySelector("#game-stat-board");
  const eyebrow = document.querySelector("#game-stats-eyebrow");
  const title = document.querySelector("#game-stats-title");
  const pill = document.querySelector("#game-stats-pill");

  if (!statBoard) {
    return;
  }

  const [leftKey, rightKey] = game.displayPlayers;
  const leftPlayer = getPlayer(leftKey);
  const rightPlayer = getPlayer(rightKey);

  if (game.status === "Played") {
    const leftStats = game.stats[leftKey];
    const rightStats = game.stats[rightKey];
    eyebrow.textContent = "Game Stats";
    title.textContent = `${getPlayerName(leftKey)} vs ${getPlayerName(rightKey)}`;
    pill.textContent = "Final Stats";
    statBoard.innerHTML = `
      <div class="game-stat-header">
        <span>${getPlayerName(leftKey)}</span>
        <b>-</b>
        <span>${getPlayerName(rightKey)}</span>
      </div>
      ${[
        makeGameStatRow(leftStats.goals, "Goals", rightStats.goals),
        makeGameStatRow(leftStats.shots, "Shots", rightStats.shots),
        makeGameStatRow(leftStats.shootingPct, "Shooting%", rightStats.shootingPct),
        makeGameStatRow(leftStats.ga, "GA", rightStats.ga),
        makeGameStatRow(leftStats.saves, "Saves", rightStats.saves),
        makeGameStatRow(leftStats.savePct, "Save%", rightStats.savePct)
      ].join("")}
    `;
    return;
  }

  if (!leftPlayer || !rightPlayer || game.players.includes("TBD")) {
    eyebrow.textContent = "Upcoming Game";
    title.textContent = "Prediction Pending";
    pill.textContent = "TBD";
    statBoard.innerHTML = `
      <div class="game-stat-header">
        <span>TBD</span>
        <b>-</b>
        <span>TBD</span>
      </div>
      ${makeGameStatRow("TBD", "Win Chance", "TBD")}
    `;
    return;
  }

  const chance = getPredictionChance(leftPlayer, rightPlayer);
  const projectedWinner = chance.left >= chance.right ? leftPlayer : rightPlayer;
  const projectedChance = Math.max(chance.left, chance.right);
  eyebrow.textContent = "Projected Matchup";
  title.textContent = `${leftPlayer.fullName} vs ${rightPlayer.fullName}`;
  pill.textContent = "Projected Winner";
  statBoard.innerHTML = `
    <div class="projected-winner-card">
      <span>Projected Winner</span>
      <strong>${projectedWinner.fullName}</strong>
      <em>${projectedChance}% win chance</em>
    </div>
    <div class="game-stat-header">
      <span>${leftPlayer.fullName}</span>
      <b>-</b>
      <span>${rightPlayer.fullName}</span>
    </div>
    ${[
      makeGameStatRow(`${chance.left}%`, "Win Chance", `${chance.right}%`),
      makeGameStatRow(leftPlayer.goals, "Goals", rightPlayer.goals),
      makeGameStatRow(leftPlayer.shots, "Shots", rightPlayer.shots),
      makeGameStatRow(leftPlayer.shootingPct, "Shooting%", rightPlayer.shootingPct),
      makeGameStatRow(leftPlayer.saves, "Saves", rightPlayer.saves),
      makeGameStatRow(leftPlayer.savePct, "Save%", rightPlayer.savePct)
    ].join("")}
  `;
}

document.querySelector("#goal-list").innerHTML = game.goals.length
  ? game.goals
      .map(
        (goal) => `
          <article class="goal-item">
            <span>${goal.label}</span>
            <strong>${goal.scorer} ${goal.score ? `(${goal.score})` : ""}</strong>
          </article>
        `
      )
      .join("")
  : `
    <article class="goal-item">
      <span>No Goals Yet</span>
      <strong>Scoring breakdown will appear here once the game is played.</strong>
    </article>
  `;

renderGameStats();
