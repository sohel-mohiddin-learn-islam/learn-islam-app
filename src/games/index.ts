import type { Game, GameCtx, Controls } from "./engine";
import { BallGame } from "./ballgame";
import { Cricket } from "./cricket";
import { Archery } from "./archery";
import { Horse } from "./horse";
import { Swim } from "./swim";

export type GameId = "football" | "archery" | "horse" | "hockey" | "cricket" | "swimming";
export function controlsFor(id: GameId): Controls {
  switch (id) {
    case "football": return BallGame.controls(false);
    case "hockey": return BallGame.controls(true);
    case "cricket": return Cricket.controls();
    case "archery": return Archery.controls();
    case "horse": return Horse.controls();
    default: return Swim.controls();
  }
}
export function createGame(id: GameId, ctx: GameCtx): Game {
  switch (id) {
    case "football": return new BallGame(ctx, false);
    case "hockey": return new BallGame(ctx, true);
    case "cricket": return new Cricket(ctx);
    case "archery": return new Archery(ctx);
    case "horse": return new Horse(ctx);
    default: return new Swim(ctx);
  }
}
