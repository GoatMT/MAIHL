const gameData = window.MAIHL_DATA;
const gameParams = new URLSearchParams(window.location.search);
const requestedGame = gameParams.get("id") || "1";
const game = gameData.games.find((item) => item.id === requestedGame) || gameData.games[0];

document.title = `${game.game} | MAIHL Game Center`;
document.querySelector("#game-date").textContent = game.date;
document.querySelector("#game-title").textContent = game.game;
document.querySelector("#player-one").textContent = game.players[0];
document.querySelector("#player-two").textContent = game.players[1];
document.querySelector("#game-winner").textContent = game.winner;
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

function getShootingPct(player) {
  return player.shots > 0 ? (player.goals / player.shots) * 100 : 0;
}

function getPredictionScore(player) {
  const shootingPct = getShootingPct(player);
  const savePct = Number.parseFloat(player.savePct) || 0;
  return player.goals * 3 + player.wins * 4 - player.losses * 2 + player.shots * 0.4 + shootingPct * 0.2 + player.saves * 0.05 + savePct * 10;
}

function renderGamePrediction() {
  const predictionCard = document.querySelector("#game-prediction-card");
  const predictionList = document.querySelector("#game-prediction-list");

  if (!predictionCard || !predictionList || game.status !== "Upcoming" || game.players.includes("TBD")) {
    return;
  }

  const homePlayer = gameData.players.find((player) => player.shortName === game.players[0]);
  const awayPlayer = gameData.players.find((player) => player.shortName === game.players[1]);

  if (!homePlayer || !awayPlayer) {
    return;
  }

  const homeScore = getPredictionScore(homePlayer);
  const awayScore = getPredictionScore(awayPlayer);
  const totalScore = homeScore + awayScore || 1;
  const homeChance = Math.round((homeScore / totalScore) * 100);
  const awayChance = 100 - homeChance;

  predictionCard.hidden = false;
  predictionList.innerHTML = `
    <article class="prediction-item">
      <div class="prediction-top">
        <div class="prediction-side">
          <strong>${homePlayer.fullName}</strong>
          <b>${homeChance}%</b>
        </div>
        <div class="prediction-vs">${game.game}</div>
        <div class="prediction-side">
          <strong>${awayPlayer.fullName}</strong>
          <b>${awayChance}%</b>
        </div>
      </div>
      <div class="prediction-stats">
        <div class="prediction-stat">
          <span>Goals</span>
          <strong>${homePlayer.goals} vs ${awayPlayer.goals}</strong>
        </div>
        <div class="prediction-stat">
          <span>Shots</span>
          <strong>${homePlayer.shots} vs ${awayPlayer.shots}</strong>
        </div>
        <div class="prediction-stat">
          <span>Shooting %</span>
          <strong>${getShootingPct(homePlayer).toFixed(1)}% vs ${getShootingPct(awayPlayer).toFixed(1)}%</strong>
        </div>
        <div class="prediction-stat">
          <span>Saves</span>
          <strong>${homePlayer.saves} vs ${awayPlayer.saves}</strong>
        </div>
        <div class="prediction-stat">
          <span>Save %</span>
          <strong>${homePlayer.savePct} vs ${awayPlayer.savePct}</strong>
        </div>
      </div>
      <p class="prediction-note">Prediction uses goals, wins, losses, shots, shooting %, saves, and save %. Home and Away are based on the listed Game Center matchup.</p>
    </article>
  `;
}

renderGamePrediction();
