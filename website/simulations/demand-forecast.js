export function run(container, action = 'default'){
  container.innerHTML = '';
  const regions = [
    {name:'Nairobi', current:850, forecast:920, trend:'↗', color:'var(--accent)'},
    {name:'Mombasa', current:620, forecast:640, trend:'↗', color:'var(--accent)'},
    {name:'Kisumu', current:380, forecast:410, trend:'↗', color:'var(--accent)'},
    {name:'Nakuru', current:290, forecast:280, trend:'↘', color:'#ff6b6b'},
    {name:'Eldoret', current:245, forecast:265, trend:'↗', color:'var(--accent)'}
  ];
  
  const accuracy = (92 + Math.random()*6).toFixed(1);
  const stockout = Math.floor(Math.random()*5 + 2);
  
  container.innerHTML = `
    <div><strong>📊 Regional Demand Forecast</strong></div>
    <div style="margin-top:1rem">
      ${regions.map(r=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;margin:0.5rem 0;background:rgba(0,255,136,0.03);border:1px solid #333;border-radius:4px">
          <div>
            <div><strong>${r.name}</strong></div>
            <div style="font-size:0.85rem;color:#999">Current: ${r.current} kg/month</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.2rem;color:${r.color}">${r.trend} ${r.forecast}</div>
            <div style="font-size:0.85rem;color:#999">Next month</div>
          </div>
        </div>
      `).join('')}
      <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #333">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div style="text-align:center;padding:1rem;background:rgba(0,255,136,0.05);border-radius:4px">
            <div style="font-size:1.8rem;color:var(--accent)">${accuracy}%</div>
            <div style="font-size:0.85rem;color:#999">Model Accuracy</div>
          </div>
          <div style="text-align:center;padding:1rem;background:rgba(0,255,136,0.05);border-radius:4px">
            <div style="font-size:1.8rem;color:var(--accent)">${stockout}%</div>
            <div style="font-size:0.85rem;color:#999">Stockout Rate</div>
          </div>
        </div>
        <div style="margin-top:1rem;color:#999;font-size:0.85rem">
          Model: LSTM + XGBoost Ensemble | Last trained: ${new Date(Date.now() - 2*24*60*60*1000).toLocaleDateString()}
        </div>
      </div>
    </div>
  `;
}
