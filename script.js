const slots = document.querySelectorAll(".slot");

slots.forEach((slot) => {
  slot.addEventListener("click", () => {
    slots.forEach((item) => item.classList.remove("selected"));
    slot.classList.add("selected");
  });
});

function getLeader(players, stat) {
  return [...players].sort((a, b) => b[stat] - a[stat])[0];
}

function renderNewsFeed() {
  const newsList = document.querySelector("#news-list");
  const leagueData = window.MAIHL_DATA;

  if (!newsList || !leagueData) {
    return;
  }

  const goalsLeader = getLeader(leagueData.players, "goals");
  const shotsLeader = getLeader(leagueData.players, "shots");
  const latestPlayedGame = [...leagueData.games].reverse().find((game) => game.status === "Played");
  const latestWinner = leagueData.players.find((player) => player.shortName === latestPlayedGame?.winner);
  const upcomingCount = leagueData.games.filter((game) => game.status === "Upcoming").length;

  const headlines = [
    {
      title: "Trade Rumor",
      body: "League sources say two mystery players have discussed a possible blockbuster practice partnership."
    },
    {
      title: "Arena Buzz",
      body: "The next MAIHL night is expected to feature new line combinations and a louder pre-game intro."
    },
    {
      title: "Power Ranking Watch",
      body: `${goalsLeader.shortName} and ${shotsLeader.shortName} are drawing attention after a hot start on the stat sheet.`
    },
    {
      title: "Locker Room Note",
      body: "Players are reportedly pushing for a special rivalry game with brighter jerseys and walkout music."
    },
    {
      title: "Scouting Report",
      body: "Coaches believe the next breakout performance could come from a player currently sitting outside the top two."
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

renderNewsFeed();

function getGoalScore(goal) {
  const [home, away] = goal.score.split("-").map((value) => Number.parseInt(value, 10));
  return { home, away };
}

function getGameAwards(games) {
  const playedGames = games.filter((game) => game.status === "Played" && game.goals.length);
  let biggestLeadValue = 0;
  let biggestComebackValue = 0;
  const biggestLeads = [];
  const biggestComebacks = [];

  playedGames.forEach((game) => {
    const maxDeficits = {};
    game.players.forEach((player) => {
      maxDeficits[player] = { value: 0, score: "0 - 0" };
    });

    game.goals.forEach((goal) => {
      const score = getGoalScore(goal);
      const leadValue = Math.abs(score.home - score.away);
      const formattedScore = `${score.home} - ${score.away}`;

      if (leadValue > 0) {
        const leader = score.home > score.away ? game.players[0] : game.players[1];
        const leadRecord = { game: game.game, player: leader, value: leadValue, score: formattedScore };

        if (leadValue > biggestLeadValue) {
          biggestLeadValue = leadValue;
          biggestLeads.length = 0;
          biggestLeads.push(leadRecord);
        } else if (leadValue === biggestLeadValue) {
          biggestLeads.push(leadRecord);
        }
      }

      if (score.home < score.away) {
        const deficitValue = score.away - score.home;
        if (deficitValue > maxDeficits[game.players[0]].value) {
          maxDeficits[game.players[0]] = { value: deficitValue, score: formattedScore };
        }
      }

      if (score.away < score.home) {
        const deficitValue = score.home - score.away;
        if (deficitValue > maxDeficits[game.players[1]].value) {
          maxDeficits[game.players[1]] = { value: deficitValue, score: formattedScore };
        }
      }

      if (score.home >= score.away && maxDeficits[game.players[0]].value > 0) {
        const comeback = {
          game: game.game,
          player: game.players[0],
          value: maxDeficits[game.players[0]].value,
          score: maxDeficits[game.players[0]].score,
          recoveredTo: formattedScore
        };

        if (comeback.value > biggestComebackValue) {
          biggestComebackValue = comeback.value;
          biggestComebacks.length = 0;
          biggestComebacks.push(comeback);
        } else if (comeback.value === biggestComebackValue) {
          biggestComebacks.push(comeback);
        }
      }

      if (score.away >= score.home && maxDeficits[game.players[1]].value > 0) {
        const comeback = {
          game: game.game,
          player: game.players[1],
          value: maxDeficits[game.players[1]].value,
          score: maxDeficits[game.players[1]].score,
          recoveredTo: formattedScore
        };

        if (comeback.value > biggestComebackValue) {
          biggestComebackValue = comeback.value;
          biggestComebacks.length = 0;
          biggestComebacks.push(comeback);
        } else if (comeback.value === biggestComebackValue) {
          biggestComebacks.push(comeback);
        }
      }
    });
  });

  return { biggestLeadValue, biggestLeads, biggestComebackValue, biggestComebacks };
}

function renderAwards() {
  const awardsGrid = document.querySelector("#awards-grid");
  const leagueData = window.MAIHL_DATA;

  if (!awardsGrid || !leagueData) {
    return;
  }

  const { biggestLeadValue, biggestLeads, biggestComebackValue, biggestComebacks } = getGameAwards(leagueData.games);
  const leadDetails = biggestLeads
    .map((lead) => `${lead.player} in ${lead.game} (${lead.score})`)
    .join(" / ");
  const comebackDetails = biggestComebacks
    .map((comeback) => `${comeback.player} in ${comeback.game} from (${comeback.score}) to (${comeback.recoveredTo})`)
    .join(" / ");

  awardsGrid.innerHTML = `
    <article class="award-item">
      <span>Biggest Lead</span>
      <strong>${biggestLeadValue} Goals</strong>
      <p class="prediction-note">${leadDetails}</p>
    </article>
    <article class="award-item">
      <span>Biggest Comeback</span>
      <strong>${biggestComebackValue} Goal${biggestComebackValue === 1 ? "" : "s"}</strong>
      <p class="prediction-note">${comebackDetails}</p>
    </article>
  `;
}

renderAwards();

function setupLeaderboardSorting() {
  const leaderboardBody = document.querySelector(".leaderboard-card tbody");
  const sortButtons = document.querySelectorAll(".sort-button");
  const leagueData = window.MAIHL_DATA;

  if (!leaderboardBody || !sortButtons.length || !leagueData) {
    return;
  }

  const rankClasses = ["rank-one", "", "", "", "", ""];

  function renderLeaderboard(sortKey) {
    const sortedPlayers = [...leagueData.players].sort((a, b) => {
      const statDifference = b[sortKey] - a[sortKey];
      return statDifference || a.fullName.localeCompare(b.fullName);
    });

    leaderboardBody.innerHTML = sortedPlayers
      .map(
        (player, index) => `
          <tr>
            <td><span class="rank ${rankClasses[index]}">${index + 1}</span></td>
            <td><a class="player-link" href="player.html?name=${player.key}">${player.fullName}</a></td>
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

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sortButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderLeaderboard(button.dataset.sort);
    });
  });
}

setupLeaderboardSorting();
