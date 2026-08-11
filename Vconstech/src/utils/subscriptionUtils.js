export const parseExpire = (str) => {
  if (!str) return null;

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const [d, m, y] = str.split("/");
  if (!d || !m || !y) return null;

  const year = y.length === 2 ? `20${y}` : y;
  return new Date(`${year}-${m}-${d}`);
};
