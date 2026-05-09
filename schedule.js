const scheduleList = document.querySelector("#schedule-list");
const data = window.MAIHL_DATA;

scheduleList.innerHTML = data.games
  .map(
    (game) => `
      <article class="schedule-item">
        <span class="game-number">${game.game}</span>
        <div class="game-details">
          <strong>${game.date}</strong>
          <span>${game.matchup}</span>
        </div>
        <span class="final-score">${game.finalScore}</span>
        <span class="winner">Winner: ${game.winner}</span>
        <span class="game-status ${game.status === "Upcoming" ? "upcoming" : ""}">${game.status}</span>
        <a class="game-center-button" href="game.html?id=${game.id}">Game Center</a>
      </article>
    `
  )
  .join("");
