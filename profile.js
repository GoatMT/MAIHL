const data = window.MAIHL_DATA;
const params = new URLSearchParams(window.location.search);
const requestedName = params.get("name") || "Muhummud";
const player = data.players.find((item) => item.key === requestedName) || data.players[0];

function ovrTier(item) {
  const rating = Number(item.overall);

  if (!rating) {
    return "ovr-na";
  }

  if (rating === 100) {
    return "ovr-legendary";
  }

  if (rating >= 90) {
    return `ovr-gold${rating >= 95 ? " ovr-cracked" : ""}`;
  }

  if (rating >= 80) {
    return "ovr-blue";
  }

  if (rating >= 70) {
    return "ovr-silver";
  }

  if (rating >= 60) {
    return "ovr-bronze";
  }

  return "ovr-na";
}

function ovrStyle(item) {
  const rating = Number(item.overall) || 0;

  if (rating >= 90 && rating < 100) {
    const scale = Math.min(1, Math.max(0, (rating - 90) / 9));
    const border = (0.48 + scale * 0.34).toFixed(2);
    const fill = (0.22 + scale * 0.18).toFixed(2);
    const spot = (0.16 + scale * 0.22).toFixed(2);
    const glow = (0.22 + scale * 0.32).toFixed(2);
    const outer = (0.08 + scale * 0.14).toFixed(2);
    const blur = Math.round(22 + scale * 22);
    return `--ovr-border-alpha: ${border}; --ovr-fill-alpha: ${fill}; --ovr-spot-alpha: ${spot}; --ovr-glow-alpha: ${glow}; --ovr-glow-blur: ${blur}px; --ovr-outer-alpha: ${outer};`;
  }

  return "";
}

document.title = `${player.fullName} | MAIHL Player Profile`;
document.querySelector("#player-name").innerHTML = `<span class="profile-flag">${player.countryFlag}</span> ${player.fullName}`;
document.querySelector("#player-number").textContent = player.jersey === "N/A" ? "#N/A" : `#${player.jersey}`;
const playerOverall = document.querySelector("#player-overall");
playerOverall.className = `ovr-badge ${ovrTier(player)}`;
playerOverall.setAttribute("style", ovrStyle(player));
playerOverall.innerHTML = player.overall ? `${player.overall} <small>OVR</small>` : `N/A <small>OVR</small>`;

const stats = [
  ["GP", player.gp],
  ["Wins", player.wins],
  ["Goals", player.goals],
  ["Shots", player.shots],
  ["Shooting %", player.shootingPct],
  ["Losses", player.losses],
  ["Saves", player.saves],
  ["Save %", player.savePct],
  ["GAA", player.gaa],
  ["GA", player.ga],
  ["+/-", player.plusMinus]
];

document.querySelector("#career-stats").innerHTML = stats
  .map(([label, value]) => `<article class="profile-stat"><span>${label}</span><strong>${value}</strong></article>`)
  .join("");

const playerGames = data.games.filter((game) => game.players.includes(player.key) || game.displayPlayers.includes(player.key) || game.winner === player.key);
document.querySelector("#game-history").innerHTML = playerGames.length
  ? playerGames
      .map(
        (game) => `
          <article class="history-item ${game.status === "Upcoming" ? "upcoming-history" : ""}">
            <span>${game.game}</span>
            <strong>${game.matchup}</strong>
            <span>${game.status === "Upcoming" ? "Upcoming - not played yet" : `Winner: ${game.winner}`}</span>
          </article>
        `
      )
      .join("")
  : `<article class="history-item"><span>No games yet</span><strong>Game history will appear here.</strong><span>Winner: TBD</span></article>`;

const playerInjuries = data.injuries.filter((injury) => injury.player === player.key);
document.querySelector("#player-injuries").innerHTML = playerInjuries.length
  ? playerInjuries
      .map(
        (injury) => `
          <article class="history-item injury-history">
            <span>${injury.label}</span>
            <strong>${injury.injury}</strong>
            <span>${injury.game} - ${injury.status}</span>
          </article>
        `
      )
      .join("")
  : `<article class="history-item upcoming-history"><span>No injuries</span><strong>No injury record for this player.</strong><span>Status: Clear</span></article>`;

function numericSavePct(item) {
  return Number.parseFloat(item.savePct) || 0;
}

function getCompletedGames() {
  return data.games.filter((game) => game.status === "Played");
}

function getScore(goal) {
  const [first, second] = goal.score.split("-").map((value) => Number.parseInt(value, 10));
  return { first, second };
}

function getComebackContribution(playerKey) {
  let contribution = 0;

  getCompletedGames().forEach((game) => {
    const [firstPlayer, secondPlayer] = game.scoreOrder;

    game.goals.forEach((goal) => {
      if (goal.scorer !== playerKey) {
        return;
      }

      const score = getScore(goal);
      const playerScore = playerKey === firstPlayer ? score.first : score.second;
      const opponentScore = playerKey === firstPlayer ? score.second : score.first;

      if (playerScore >= opponentScore) {
        contribution += 1;
      }
    });
  });

  return contribution;
}

function getAwardWinners() {
  const players = data.players;
  const bestGoals = [...players].sort((a, b) => b.goals - a.goals)[0];
  const bestGoalie = [...players].sort((a, b) => numericSavePct(b) - numericSavePct(a) || b.saves - a.saves)[0];
  const mostEffort = [...players].sort((a, b) => b.shots - a.shots)[0];
  const comebackKing = [...players].sort((a, b) => getComebackContribution(b.key) - getComebackContribution(a.key))[0];
  const eliteMvp = [...players].sort((a, b) => {
    const aRating = a.goals * 3 + a.saves * 0.8 + a.shots * 0.35 + numericSavePct(a) * 20 + getComebackContribution(a.key) * 2;
    const bRating = b.goals * 3 + b.saves * 0.8 + b.shots * 0.35 + numericSavePct(b) * 20 + getComebackContribution(b.key) * 2;
    return bRating - aRating;
  })[0];

  return [
    { title: "🏆 Golden Sniper Trophy", winner: bestGoals, summary: `${bestGoals.goals} goals` },
    { title: "🏆 Iron Wall Trophy", winner: bestGoalie, summary: `${bestGoalie.savePct} save %, ${bestGoalie.saves} saves` },
    { title: "🏆 Endurance Engine Trophy", winner: mostEffort, summary: `${mostEffort.shots} shots` },
    { title: "🏆 Clutch King Trophy", winner: comebackKing, summary: `${getComebackContribution(comebackKing.key)} comeback contributions` },
    { title: "🏆 Elite MVP Trophy", winner: eliteMvp, summary: `${eliteMvp.goals} goals, ${eliteMvp.saves} saves, ${eliteMvp.shots} shots` }
  ];
}

function renderProfileAwards() {
  const completedGames = getCompletedGames();
  const awardsTitle = document.querySelector("#profile-awards-title");
  const awardsContainer = document.querySelector("#profile-awards");
  const historyContainer = document.querySelector("#award-history");
  const cycleGame = Math.floor(completedGames.length / 5) * 5;
  const trophyNames = [
    "🏆 Golden Sniper Trophy",
    "🏆 Iron Wall Trophy",
    "🏆 Endurance Engine Trophy",
    "🏆 Clutch King Trophy",
    "🏆 Elite MVP Trophy"
  ];

  if (cycleGame < 5) {
    awardsTitle.textContent = "Awards Activate After Game 5";
    awardsContainer.innerHTML = trophyNames
      .map(
        (title) => `
          <article class="profile-award-card">
            <strong>${title}</strong>
            <span>No trophy yet</span>
            <p>Award cycle opens after 5 completed games.</p>
          </article>
        `
      )
      .join("");
    historyContainer.innerHTML = `<p class="award-empty">Award history will appear after the first 5-game cycle.</p>`;
    return;
  }

  awardsTitle.textContent = `After Game ${cycleGame} Awards`;
  const awardWinners = getAwardWinners();
  awardsContainer.innerHTML = awardWinners
    .map(
      (award) => `
        <article class="profile-award-card ${award.winner.key === player.key ? "is-player-award" : ""}">
          <strong>${award.title}</strong>
          <span>${award.winner.key === player.key ? award.winner.fullName : "No trophy for this player yet"}</span>
          <p>${award.winner.key === player.key ? award.summary : `Current winner: ${award.winner.fullName} - ${award.summary}`}</p>
        </article>
      `
    )
    .join("");
  historyContainer.innerHTML = data.awardHistory.length
    ? data.awardHistory.map((item) => `<p>${item}</p>`).join("")
    : `<p class="award-empty">No past award cycles stored yet.</p>`;
}

renderProfileAwards();
