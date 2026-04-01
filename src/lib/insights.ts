import type { DailyInsights, DailyPrimeScore, Pillar, PillarScore, ScoreReason } from "./types";

const PILLAR_LABELS: Record<Pillar, string> = {
  face: "Face",
  physic: "Physic",
  brain: "Brain",
};

function sortByScoreAscending(a: PillarScore, b: PillarScore): number {
  return a.score - b.score;
}

function sortByImpactAscending(a: ScoreReason, b: ScoreReason): number {
  return a.impact - b.impact;
}

function sortByImpactDescending(a: ScoreReason, b: ScoreReason): number {
  return b.impact - a.impact;
}

function topReasons(score: PillarScore, direction: "positive" | "negative", limit = 2): ScoreReason[] {
  const filtered = score.reasons.filter((reason) => reason.direction === direction);
  return direction === "positive"
    ? filtered.sort(sortByImpactDescending).slice(0, limit)
    : filtered.sort(sortByImpactAscending).slice(0, limit);
}

function actionFromReason(reason: ScoreReason): string | undefined {
  switch (reason.key) {
    case "face_morning_routine":
      return "Finish the morning skincare routine before checking your phone.";
    case "face_night_routine":
      return "Lock in the night routine and remove makeup before bed.";
    case "face_products":
      return "Use the core skincare products in your plan and track them daily.";
    case "face_sunscreen":
      return "Keep sunscreen visible by your keys and apply it before going out.";
    case "face_water":
      return "Keep a water bottle nearby and finish the target earlier in the day.";
    case "face_sleep":
      return "Protect a full night of sleep so skin can recover properly.";
    case "face_skin_condition":
      return "Stay consistent for another week and watch the skin trend, not just one day.";
    case "face_makeup":
      return "If makeup is worn, make removal non-negotiable.";
    case "physic_workout":
      return "Anchor tomorrow with a shorter workout so the streak stays alive.";
    case "physic_workout_quality":
      return "Set the workout duration and intensity before starting.";
    case "physic_calories":
      return "Tighten meal choices around your calorie target.";
    case "physic_protein":
      return "Spread protein across meals instead of trying to catch up late.";
    case "physic_meals":
      return "Use a clearer meal plan so you do not drift off target.";
    case "physic_water":
      return "Start with a filled bottle and hit the water target before evening.";
    case "physic_steps":
      return "Add two short walks to raise daily movement.";
    case "physic_sleep":
      return "Treat sleep as training recovery and protect the bedtime window.";
    case "physic_recovery":
      return "Keep tomorrow lighter if soreness is building.";
    case "brain_deep_work":
      return "Block one uninterrupted focus session early in the day.";
    case "brain_topics":
      return "Write the focus topic before the session starts.";
    case "brain_screen_time":
      return "Cap entertainment screen time after your main work block.";
    case "brain_social_screen":
      return "Trim social and entertainment scrolling to protect focus.";
    case "brain_meditation":
      return "Start with a short breathing session before work.";
    case "brain_mood":
      return "Keep the day simple and avoid overcommitting when mood is low.";
    case "brain_clarity":
      return "Reduce context switching and protect a cleaner work block.";
    case "brain_caffeine":
      return "Keep caffeine earlier and under your usual ceiling.";
    case "brain_sleep":
      return "Sleep is the multiplier here, so protect a full night.";
    default:
      return undefined;
  }
}

function summarizeStrength(score: DailyPrimeScore): string {
  const strongest = [score.face, score.physic, score.brain].sort((a, b) => b.score - a.score)[0];
  if (strongest.score >= 80) {
    return `${PILLAR_LABELS[strongest.pillar]} was the standout today at ${strongest.score}/100.`;
  }

  if (score.overall >= 80) {
    return `Strong all-around day at ${score.overall}/100.`;
  }

  return `You kept momentum going with an overall score of ${score.overall}/100.`;
}

export function generateDailyInsights(score: DailyPrimeScore): DailyInsights {
  const pillars = [score.face, score.physic, score.brain].sort(sortByScoreAscending);
  const weakest = pillars[0];
  const secondWeakest = pillars[1];

  const strengths = [
    ...topReasons(score.face, "positive", 1),
    ...topReasons(score.physic, "positive", 1),
    ...topReasons(score.brain, "positive", 1),
  ]
    .map((reason) => reason.detail)
    .filter(Boolean)
    .slice(0, 3);

  const improvements = [
    ...topReasons(weakest, "negative", 2),
    ...topReasons(secondWeakest, "negative", 1),
  ]
    .map((reason) => reason.detail)
    .filter(Boolean)
    .slice(0, 3);

  const tomorrowActions = [
    ...topReasons(weakest, "negative", 2)
      .map(actionFromReason)
      .filter((value): value is string => Boolean(value)),
    ...topReasons(secondWeakest, "negative", 1)
      .map(actionFromReason)
      .filter((value): value is string => Boolean(value)),
  ].slice(0, 3);

  if (strengths.length === 0) {
    strengths.push("You logged enough to see where tomorrow can be sharper.");
  }

  if (improvements.length === 0) {
    improvements.push("The day was balanced, so the next step is consistency.");
  }

  if (tomorrowActions.length === 0) {
    tomorrowActions.push("Keep the same structure tomorrow and nudge one habit slightly upward.");
  }

  return {
    summary: summarizeStrength(score),
    strengths,
    improvements,
    tomorrowActions,
  };
}
