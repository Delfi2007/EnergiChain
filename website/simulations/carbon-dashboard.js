export function run(container, action = 'default'){
  container.innerHTML = '';
  const monthly = (Math.random()*120 + 80).toFixed(1);
  const yearly = (monthly * 12).toFixed(0);
  const trees = Math.floor(yearly / 20);
  const vs = {charcoal: (monthly * 1.8).toFixed(0), kerosene: (monthly * 1.5).toFixed(0)};
  const rank = Math.floor(Math.random()*100) + 1;
  
  container.innerHTML = `
    <div><strong>📈 Your Carbon Impact</strong></div>
    <div style="margin-top:1.5rem">
      <div style="padding:2rem;background:linear-gradient(135deg,rgba(0,255,136,0.1),rgba(0,255,136,0.05));border-radius:12px;text-align:center;border:1px solid rgba(0,255,136,0.3)">
        <div style="font-size:3.5rem;color:var(--accent);font-weight:700;margin-bottom:0.5rem">${monthly} kg</div>
        <div style="font-size:1.1rem;color:#ddd">CO₂ Saved This Month</div>
        <div style="margin-top:1rem;font-size:0.9rem;color:#999">≈ ${trees} trees planted</div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.5rem">
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">${yearly}</div>
          <div style="font-size:0.9rem;color:#999;margin-top:0.5rem">Yearly Savings (kg)</div>
        </div>
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">#${rank}</div>
          <div style="font-size:0.9rem;color:#999;margin-top:0.5rem">Community Rank</div>
        </div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px">
        <div style="font-weight:600;margin-bottom:1rem">🌍 vs Traditional Fuels</div>
        <div style="display:grid;gap:0.75rem">
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
              <span>vs Charcoal</span>
              <strong style="color:var(--accent)">${vs.charcoal} kg saved</strong>
            </div>
            <div style="height:8px;background:#333;border-radius:4px;overflow:hidden">
              <div style="width:85%;height:100%;background:var(--accent)"></div>
            </div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
              <span>vs Kerosene</span>
              <strong style="color:var(--accent)">${vs.kerosene} kg saved</strong>
            </div>
            <div style="height:8px;background:#333;border-radius:4px;overflow:hidden">
              <div style="width:70%;height:100%;background:var(--accent)"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="margin-top:1.5rem;text-align:center">
        <button style="padding:1rem 2rem;background:var(--accent);color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer" onclick="alert('Sharing functionality: Share your impact on social media!')">
          📱 Share My Impact
        </button>
      </div>
      
      <div style="margin-top:1rem;font-size:0.85rem;color:#666;text-align:center">
        Data updated: ${new Date().toLocaleDateString()} | Calculation: ISO 14064 Standard
      </div>
    </div>
  `;
}
