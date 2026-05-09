const data = window.MAIHL_DATA;
const params = new URLSearchParams(window.location.search);
const requestedName = params.get("name") || "Muhummud";
const player = data.players.find((item) => item.key === requestedName) || data.players[0];

document.title = `${player.fullName} | MAIHL Player Profile`;
document.querySelector("#player-name").textContent = player.fullName;

const stats = [
  ["GP", player.gp],
  ["Wins", player.wins],
  ["Goals", player.goals],
  ["Shots", player.shots],
  ["Losses", player.losses],
  ["Saves", player.saves],
  ["Save %", player.savePct],
  ["GAA", player.gaa],
  ["GA", player.ga]
];

document.querySelector("#career-stats").innerHTML = stats
  .map(([label, value]) => `<article class="profile-stat"><span>${label}</span><strong>${value}</strong></article>`)
  .join("");

const playerGames = data.games.filter((game) => game.matchup.includes(player.shortName) || game.winner === player.shortName);
document.querySelector("#game-history").innerHTML = playerGames.length
  ? playerGames
      .map(
        (game) => `
          <article class="history-item">
            <span>${game.game}</span>
            <strong>${game.matchup}</strong>
            <span>${game.winner === "TBD" ? "Winner: TBD" : `Winner: ${game.winner}`}</span>
          </article>
        `
      )
      .join("")
  : `<article class="history-item"><span>No games yet</span><strong>Game history will appear here.</strong><span>Winner: TBD</span></article>`;
