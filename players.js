const playersList = document.querySelector("#players-list");
const data = window.MAIHL_DATA;

playersList.innerHTML = data.players
  .map(
    (player, index) => `
      <a class="player-list-row" href="player.html?name=${player.key}">
        <span class="rank">${index + 1}</span>
        <strong>${player.countryFlag} ${player.fullName}</strong>
        <span>${player.jersey === "N/A" ? "#N/A" : `#${player.jersey}`}</span>
        <b>${player.overall ? player.overall : "N/A"} <small>OVR</small></b>
        <span>${player.goals} Goals</span>
        <span>${player.shots} Shots</span>
      </a>
    `
  )
  .join("");
