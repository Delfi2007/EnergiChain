export function run(container, action = 'default'){
  container.innerHTML = '';
  const tokens = Math.floor(Math.random()*50 + 10);
  const value = (tokens * 0.85).toFixed(2);
  const co2 = (tokens * 2.3).toFixed(1);
  
  container.innerHTML = `
    <div><strong>🌱 Carbon Tokens Earned</strong></div>
    <div style="margin-top:1rem">
      <div style="font-size:2rem;color:var(--accent);margin:1rem 0"><strong>+${tokens} ECO</strong></div>
      <div style="display:grid;gap:0.5rem;margin-top:1rem">
        <div>💵 Market Value: <strong>KES ${value}</strong></div>
        <div>🌍 CO₂ Offset: <strong>${co2} kg</strong></div>
        <div>📊 Total Balance: <strong>${Math.floor(Math.random()*500 + tokens)} ECO</strong></div>
      </div>
      <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #333">
        <div style="color:#999;font-size:0.9rem">
          <div>• Redeemable for cylinder discounts</div>
          <div>• Tradeable on EnergiChain Marketplace</div>
          <div>• Contributes to ESG impact score</div>
        </div>
      </div>
    </div>
  `;
}
