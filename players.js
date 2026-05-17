const playersList = document.querySelector("#players-list");
const data = window.MAIHL_DATA;

function ovrTier(player) {
  const rating = Number(player.overall);

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

function ovrStyle(player) {
  const rating = Number(player.overall) || 0;

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

playersList.innerHTML = data.players
  .map(
    (player, index) => `
      <a class="player-list-row" href="player.html?name=${player.key}">
        <span class="rank">${index + 1}</span>
        <strong>${player.countryFlag} ${player.fullName}</strong>
        <span>${player.jersey === "N/A" ? "#N/A" : `#${player.jersey}`}</span>
        <b class="ovr-badge ${ovrTier(player)}" style="${ovrStyle(player)}">${player.overall ? player.overall : "N/A"} <small>OVR</small></b>
        <span>${player.goals} Goals</span>
        <span>${player.shots} Shots</span>
      </a>
    `
  )
  .join("");
