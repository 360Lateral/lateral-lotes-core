export const score360Tone = (score: number | null | undefined) => {
  if (score == null || !Number.isFinite(score) || score < 0 || score > 10) return "missing";
  if (score < 5) return "danger";
  if (score < 7) return "warning";
  return "success";
};

export const formatScore360 = (score: number | null | undefined): string =>
  score360Tone(score) === "missing" ? "Sin score" : `${Number(score).toFixed(1)}/10`;