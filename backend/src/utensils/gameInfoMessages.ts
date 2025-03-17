export const gameInfoMessages = {
    draw: (playerOne: string, playerTwo: string, scoreOne: number, scoreTwo: number) => `
      <div class="draw">It's a draw! You both lose 😃</div>
      <div class="reactiontime-wrapper">
        <div class="reactiontimeOne">
          <div class="playerNameWonOne">${playerOne}</div>
          <div class="playerNameReactionOne">Score: ${scoreOne}</div>
        </div>
        <div class="reactiontimeTwo">
          <div class="playerNameWonTwo">${playerTwo}</div>
          <div class="playerNameReactionTwo">Score: ${scoreTwo}</div>
        </div>
      </div>
    `,

    gameOver: (winner: string, playerOne: string, playerTwo: string, scoreOne: number, scoreTwo: number) => `
      <div class="gameover">Game Over! Winner: ${winner}</div>
      <div class="reactiontime-wrapper">
        <div class="reactiontimeOne">
          <div class="playerNameWonOne">${playerOne}</div>
          <div class="playerNameReactionOne">Score: ${scoreOne}</div>
        </div>
        <div class="reactiontimeTwo">
          <div class="playerNameWonTwo">${playerTwo}</div>
          <div class="playerNameReactionTwo">Score: ${scoreTwo}</div>
        </div>
      </div>
    `,

    roundDraw: (playerOne: string, playerTwo: string, reactionOne: number, reactionTwo: number) => `
      <div class="draw">It's a draw!</div>
      <div class="reactiontime-wrapper">
        <div class="reactiontimeOne">
          <div class="playerNameWonOne">${playerOne}</div>
          <div class="playerNameReactionOne">Reaction Time: ${(reactionOne / 1000).toFixed(2)}</div>
        </div>
        <div class="reactiontimeTwo">
          <div class="playerNameWonTwo">${playerTwo}</div>
          <div class="playerNameReactionTwo">Reaction Time: ${(reactionTwo / 1000).toFixed(2)}</div>
        </div>
      </div>
    `,

    roundWin: (winner: string, playerOne: string, playerTwo: string, reactionOne: number, reactionTwo: number) => `
      <div class="playerwon">Round Winner: ${winner}</div>
      <div class="reactiontime-wrapper">
        <div class="reactiontimeOne">
          <div class="playerNameWonOne">${playerOne}</div>
          <div class="playerNameReactionOne">Reaction Time: ${(reactionOne / 1000).toFixed(2)}</div>
        </div>
        <div class="reactiontimeTwo">
          <div class="playerNameWonTwo">${playerTwo}</div>
          <div class="playerNameReactionTwo">Reaction Time: ${(reactionTwo / 1000).toFixed(2)}</div>
        </div>
      </div>
    `,
};