// https://www.chessprogramming.org/Pawn_Advantage,_Win_Percentage,_and_Elo
// Division by 100 is added to convert CP score to pawn advantage
export const centipawnToWinProbability = (centipawnScore: number) =>
  1 / (1 + 10 ** (-centipawnScore / 100 / 4));
