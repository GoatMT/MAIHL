const data = window.MAIHL_DATA;
const playerASelect = document.querySelector("#player-a");
const playerBSelect = document.querySelector("#player-b");
const compareResult = document.querySelector("#compare-result");

function optionLabel(player, selectedKey) {
  return `${player.key === selectedKey ? "✓ " : ""}${player.fullName}`;
}

function fillSelect(select, selectedKey) {
  select.innerHTML = data.players
    .map((player) => `<option value="${player.key}" ${player.key === selectedKey ? "selected" : ""}>${optionLabel(player, selectedKey)}</option>`)
    .join("");
}

function refreshSelectLabels() {
  const selectedA = playerASelect.value;
  const selectedB = playerBSelect.value;
  fillSelect(playerASelect, selectedA);
  fillSelect(playerBSelect, selectedB);
}

function parseValue(value) {
  if (typeof value === "number") {
    return value;
  }

  return Number.parseFloat(String(value).replace("%", "")) || 0;
}

function compareClass(left, right) {
  const leftValue = parseValue(left);
  const rightValue = parseValue(right);

  if (leftValue > rightValue) {
    return ["stat-better", "stat-worse"];
  }

  if (rightValue > leftValue) {
    return ["stat-worse", "stat-better"];
  }

  return ["stat-tie", "stat-tie"];
}

function row(left, label, right) {
  const [leftClass, rightClass] = compareClass(left, right);
  return `
    <div class="versus-row">
      <span class="versus-left ${leftClass}">${left}</span>
      <span class="versus-name">${label}</span>
      <span class="versus-right ${rightClass}">${right}</span>
    </div>
  `;
}

function effectiveRating(player) {
  if (player.overall) {
    return player.overall;
  }

  return Math.min(78, 55 + player.goals * 1.4 + player.wins * 4 + parseValue(player.savePct) * 12 + player.shots * 0.15);
}

function getPrediction(leftPlayer, rightPlayer) {
  const leftRating = effectiveRating(leftPlayer);
  const rightRating = effectiveRating(rightPlayer);
  const leftChance = Math.min(95, Math.max(5, Math.round(50 + (leftRating - rightRating) * 1.3)));
  const rightChance = 100 - leftChance;
  const predicted = rightChance > leftChance ? rightPlayer : leftPlayer;
  const chance = Math.max(leftChance, rightChance);
  return { predicted, chance, leftChance, rightChance };
}

function renderComparison() {
  const leftPlayer = data.players.find((player) => player.key === playerASelect.value);
  const rightPlayer = data.players.find((player) => player.key === playerBSelect.value);
  const prediction = getPrediction(leftPlayer, rightPlayer);

  compareResult.innerHTML = `
    <section class="compare-section">
      <h2 class="compare-match-title">${leftPlayer.fullName} <span>-</span> Core Stats <span>-</span> ${rightPlayer.fullName}</h2>
      <div class="versus-rows">
        ${row(leftPlayer.goals, "Goals", rightPlayer.goals)}
        ${row(leftPlayer.shots, "Shots", rightPlayer.shots)}
        ${row(leftPlayer.shootingPct, "Shooting %", rightPlayer.shootingPct)}
        ${row(leftPlayer.plusMinus, "+/-", rightPlayer.plusMinus)}
      </div>
    </section>

    <section class="compare-section">
      <h2 class="compare-match-title">${leftPlayer.fullName} <span>-</span> Goalie Stats <span>-</span> ${rightPlayer.fullName}</h2>
      <div class="versus-rows">
        ${row(leftPlayer.saves, "Saves", rightPlayer.saves)}
        ${row(leftPlayer.savePct, "Save %", rightPlayer.savePct)}
      </div>
    </section>

    <section class="prediction-summary">
      <div class="rating-grid">
        <article>
          <span>${leftPlayer.fullName}</span>
          <strong>${leftPlayer.overall || "N/A"} OVR</strong>
          <em>${prediction.leftChance}% win chance</em>
        </article>
        <article class="winner-prediction">
          <span>Projected Winner</span>
          <strong>${prediction.predicted.fullName}</strong>
          <em>${prediction.chance}%</em>
        </article>
        <article>
          <span>${rightPlayer.fullName}</span>
          <strong>${rightPlayer.overall || "N/A"} OVR</strong>
          <em>${prediction.rightChance}% win chance</em>
        </article>
      </div>
    </section>
  `;
}

fillSelect(playerASelect, "Muhummud");
fillSelect(playerBSelect, "Ahmed");
playerASelect.addEventListener("change", () => {
  refreshSelectLabels();
  renderComparison();
});
playerBSelect.addEventListener("change", () => {
  refreshSelectLabels();
  renderComparison();
});
renderComparison();
