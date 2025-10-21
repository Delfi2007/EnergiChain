// Pricing Oracle stub (immutable feed simulation)
export function getPrice(region = 'nairobi') {
  const base = { nairobi: 2800, mombasa: 2850, kisumu: 2750 };
  const transport = 120; // avg transport cost
  const tax = Math.round(base[region] * 0.08);
  const price = base[region] + transport + tax;
  return Promise.resolve({ region, base: base[region], transport, tax, price });
}
