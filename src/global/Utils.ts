export function CapitalizeFirst(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

//TODO: use semver parse
export function compareVersion(_v1: string, _v2: string) {
  const v1 = _v1.split('.');
  const v2 = _v2.split('.');
  const k = Math.min(v1.length, v2.length);
  for (let i = 0; i < k; ++i) {
    // @ts-ignore
    v1[i] = parseInt(v1[i], 10);
    // @ts-ignore
    v2[i] = parseInt(v2[i], 10);
    if (v1[i] > v2[i]) return 1;
    if (v1[i] < v2[i]) return -1;
  }
  return v1.length === v2.length ? 0 : v1.length < v2.length ? -1 : 1;
}
