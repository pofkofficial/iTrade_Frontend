// Christmas promotion window: 1 Nov – 31 Dec, every year. It switches itself on and off.
// Preview outside the window by adding ?promo=on (or ?promo=off) to any URL.
export const isChristmasPromo = (now = new Date()) => {
  const flag = new URLSearchParams(window.location.search).get('promo');
  if (flag === 'on') return true;
  if (flag === 'off') return false;
  const month = now.getMonth(); // 10 = November, 11 = December
  return month === 10 || month === 11;
};

export const daysLeftInPromo = (now = new Date()) => {
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  return Math.max(1, Math.ceil((end - now) / 86400000));
};
