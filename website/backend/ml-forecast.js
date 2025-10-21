// Demand forecasting stub
export function forecast(region = 'nairobi') {
  // Return a small array of next 6 months predictions
  const base = { nairobi: 1000, mombasa: 700, kisumu: 450 };
  const now = new Date();
  const months = [];
  for (let i=0;i<6;i++){
    const month = new Date(now.getFullYear(), now.getMonth()+i, 1).toLocaleString('default', { month: 'short' });
    months.push({ month, predicted: Math.round(base[region] * (1 + Math.random()*0.2 - 0.05)) });
  }
  return Promise.resolve({ region, months });
}
