export function levelInfo(xp: number) {
  let lvl = 1, need = 150, rem = xp;
  while (rem >= need) { rem -= need; lvl++; need = Math.round(150 * Math.pow(lvl, 1.35)); }
  return { lvl, cur: rem, need };
}

export function xpMult(skills: string[]) {
  return 1 + 0.15 * skills.length;
}

export function addXp(base: number, xp: number, skills: string[]) {
  const before = levelInfo(xp).lvl;
  xp += Math.round(base * xpMult(skills));
  const after = levelInfo(xp).lvl;
  if (after > before) return { leveled: true, after };
  return { leveled: false };
}