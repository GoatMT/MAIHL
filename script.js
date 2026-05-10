const slots = document.querySelectorAll(".slot");

slots.forEach((slot) => {
  slot.addEventListener("click", () => {
    slots.forEach((item) => item.classList.remove("selected"));
    slot.classList.add("selected");
  });
});

const leagueData = window.MAIHL_DATA;

function getPlayer(key) {
  return leagueData.players.find((player) => player.key === key);
}

function getLeader(players, stat) {
  return [...players].sort((a, b) => b[stat] - a[stat])[0];
}

function parseGameDate(game) {
  const time = Date.parse(game.date);
  return Number.isNaN(time) ? 0 : time;
}

function sortByRecency(a, b) {
  const dateDifference = parseGameDate(b) - parseGameDate(a);

  if (dateDifference) {
    return dateDifference;
  }

  return Number.parseInt(b.gameId || "0", 10) - Number.parseInt(a.gameId || "0", 10);
}

function getGoalScore(goal) {
  const [first, second] = goal.score.split("-").map((value) => Number.parseInt(value, 10));
  return { first, second };
}

function renderNewsFeed() {
  const newsList = document.querySelector("#news-list");

  if (!newsList || !leagueData) {
    return;
  }

  const goalsLeader = getLeader(leagueData.players, "goals");
  const shotsLeader = getLeader(leagueData.players, "shots");
  const savesLeader = getLeader(leagueData.players, "saves");
  const latestPlayedGame = [...leagueData.games].reverse().find((game) => game.status === "Played");
  const upcomingCount = leagueData.games.filter((game) => game.status === "Upcoming").length;

  const headlines = [
    {
      title: "Game 3 Watch",
      body: "Muhummud and Ahmed are lined up again, with Game 3 expected to decide early-season momentum."
    },
    {
      title: "Goal Race Locked",
      body: `${goalsLeader.shortName} is tied at the top of the goal race, keeping the scoring title wide open.`
    },
    {
      title: "Shot Pressure Report",
      body: `${shotsLeader.shortName} leads the league in shots, giving the analytics board a clear pressure marker.`
    },
    {
      title: "Goalie Spotlight",
      body: `${savesLeader.shortName} owns the current saves lead and is tracking as the early Iron Wall favorite.`
    },
    {
      title: "Health Update",
      body: "Ahmed's right wrist and Muhummud's left foot cramp are both listed as fully healed."
    },
    {
      title: "Schedule Desk",
      body: `${upcomingCount} upcoming games remain on the MAIHL board, with several matchups still marked TBD.`
    },
    {
      title: "Game Center Upgrade",
      body: `${latestPlayedGame?.game || "The latest game"} now includes full scoring, per-game stats, and winner details.`
    },
    {
      title: "Rivalry Signal",
      body: "The Muhummud-Ahmed matchup is becoming the main storyline after two split results."
    }
  ];

  newsList.innerHTML = headlines
    .map(
      (item) => `
        <article class="news-item">
          <h3>${item.title}</h3>
          <p>${item.body}</p>
        </article>
      `
    )
    .join("");
}

function getLeadRecords(games) {
  const records = [];

  games
    .filter((game) => game.status === "Played" && game.goals.length)
    .forEach((game) => {
      game.goals.forEach((goal) => {
        const score = getGoalScore(goal);
        const leadValue = Math.abs(score.first - score.second);

        if (!leadValue) {
          return;
        }

        const leader = score.first > score.second ? game.scoreOrder[0] : game.scoreOrder[1];
        records.push({
          game: game.game,
          gameId: game.id,
          date: game.date,
          player: leader,
          value: leadValue,
          score: `${score.first} - ${score.second}`
        });
      });
    });

  return records;
}

function getComebackRecords(games) {
  const records = [];

  games
    .filter((game) => game.status === "Played" && game.goals.length)
    .forEach((game) => {
      const [firstPlayer, secondPlayer] = game.scoreOrder;
      const maxDeficits = {
        [firstPlayer]: { value: 0, score: "0 - 0" },
        [secondPlayer]: { value: 0, score: "0 - 0" }
      };
      const bestCompleted = {};

      game.goals.forEach((goal) => {
        const score = getGoalScore(goal);
        const formattedScore = `${score.first} - ${score.second}`;

        if (score.first < score.second) {
          const deficit = score.second - score.first;
          if (deficit > maxDeficits[firstPlayer].value) {
            maxDeficits[firstPlayer] = { value: deficit, score: formattedScore };
          }
        }

        if (score.second < score.first) {
          const deficit = score.first - score.second;
          if (deficit > maxDeficits[secondPlayer].value) {
            maxDeficits[secondPlayer] = { value: deficit, score: formattedScore };
          }
        }

        if (score.first >= score.second && maxDeficits[firstPlayer].value > 0) {
          const previous = bestCompleted[firstPlayer];
          if (!previous || maxDeficits[firstPlayer].value > previous.value) {
            bestCompleted[firstPlayer] = {
              game: game.game,
              gameId: game.id,
              date: game.date,
              player: firstPlayer,
              value: maxDeficits[firstPlayer].value,
              score: maxDeficits[firstPlayer].score,
              recoveredTo: formattedScore
            };
          }
        }

        if (score.second >= score.first && maxDeficits[secondPlayer].value > 0) {
          const previous = bestCompleted[secondPlayer];
          if (!previous || maxDeficits[secondPlayer].value > previous.value) {
            bestCompleted[secondPlayer] = {
              game: game.game,
              gameId: game.id,
              date: game.date,
              player: secondPlayer,
              value: maxDeficits[secondPlayer].value,
              score: maxDeficits[secondPlayer].score,
              recoveredTo: formattedScore
            };
          }
        }
      });

      records.push(...Object.values(bestCompleted));
    });

  return records;
}

function renderAwards() {
  const awardsGrid = document.querySelector("#awards-grid");

  if (!awardsGrid || !leagueData) {
    return;
  }

  const leadRecords = getLeadRecords(leagueData.games);
  const biggestLeadValue = Math.max(0, ...leadRecords.map((record) => record.value));
  const biggestLeadRecords = leadRecords
    .filter((record) => record.value === biggestLeadValue)
    .sort(sortByRecency);

  const comebackRecords = getComebackRecords(leagueData.games);
  const biggestComebackValue = Math.max(0, ...comebackRecords.map((record) => record.value));
  const latestBiggestComebacks = comebackRecords
    .filter((record) => record.value === biggestComebackValue && record.value > 0)
    .sort(sortByRecency)
    .slice(0, 3);
  const comebackLabels = ["Latest", "2nd Latest", "3rd Latest"];
  const comebackLines = comebackLabels
    .map((label, index) => {
      const comeback = latestBiggestComebacks[index];

      if (!comeback) {
        return `<p><b>${label}:</b> No tied biggest comeback yet</p>`;
      }

      return `<p><b>${label}:</b> ${comeback.player} in ${comeback.game} from (${comeback.score}) to (${comeback.recoveredTo})</p>`;
    })
    .join("");

  awardsGrid.innerHTML = `
    <article class="award-item">
      <span>Biggest Lead</span>
      <strong>${biggestLeadValue} Goals</strong>
      <p class="prediction-note">
        ${biggestLeadRecords.map((lead) => `${lead.player} in ${lead.game} (${lead.score})`).join(" / ")}
      </p>
    </article>
    <article class="award-item">
      <span>Biggest Comeback</span>
      <strong>${biggestComebackValue} Goal${biggestComebackValue === 1 ? "" : "s"}</strong>
      <div class="award-list">
        ${comebackLines}
      </div>
    </article>
  `;
}

function renderInjuries() {
  const injuryList = document.querySelector("#injury-list");

  if (!injuryList || !leagueData) {
    return;
  }

  injuryList.innerHTML = leagueData.injuries
    .map(
      (injury) => `
        <article class="injury-item">
          <span>${injury.label}</span>
          <strong>${injury.player}: ${injury.injury}</strong>
          <p>${injury.game} • ${injury.date}</p>
          <em>${injury.status}</em>
        </article>
      `
    )
    .join("");
}

function setupLeaderboardSorting() {
  const leaderboardBody = document.querySelector("#leaderboard-body");
  const sortButtons = document.querySelectorAll(".sort-button");

  if (!leaderboardBody || !leagueData) {
    return;
  }

  const rankClasses = ["rank-one", "", "", "", "", ""];

  function renderLeaderboard(sortKey = null) {
    const sortedPlayers = [...leagueData.players].sort((a, b) => {
      if (!sortKey) {
        return leagueData.players.indexOf(a) - leagueData.players.indexOf(b);
      }

      const statDifference = b[sortKey] - a[sortKey];
      return statDifference || leagueData.players.indexOf(a) - leagueData.players.indexOf(b);
    });

    leaderboardBody.innerHTML = sortedPlayers
      .map(
        (player, index) => `
          <tr>
            <td><span class="rank ${rankClasses[index]}">${index + 1}</span></td>
            <td><a class="player-link" href="player.html?name=${player.key}">${player.fullName}</a></td>
            <td>${player.jersey === "N/A" ? "N/A" : `#${player.jersey}`}</td>
            <td>${player.gp}</td>
            <td>${player.wins}</td>
            <td>${player.goals}</td>
            <td>${player.shots}</td>
            <td>${player.losses}</td>
          </tr>
        `
      )
      .join("");
  }

  renderLeaderboard();

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sortButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderLeaderboard(button.dataset.sort);
    });
  });
}

renderNewsFeed();
renderAwards();
renderInjuries();
setupLeaderboardSorting();
