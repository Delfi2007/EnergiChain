export function run(container, action = 'default'){
  container.innerHTML = '';
  const points = Math.floor(Math.random()*100 + 50);
  const totalTrees = Math.floor(Math.random()*20 + 5);
  const location = ['Karura Forest', 'Ngong Hills', 'Aberdare Range', 'Mt Kenya Forest'][Math.floor(Math.random()*4)];
  const species = ['Indigenous Cedar', 'Bamboo', 'Acacia', 'Olive Tree'][Math.floor(Math.random()*4)];
  
  container.innerHTML = `
    <div><strong>🌳 Tree Planted Successfully!</strong></div>
    <div style="margin-top:1.5rem">
      <div style="padding:2rem;background:linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,255,136,0.05));border-radius:12px;text-align:center;border:1px solid rgba(0,255,136,0.3)">
        <div style="font-size:4rem;margin-bottom:1rem">🌲</div>
        <div style="font-size:1.3rem;color:var(--accent);font-weight:600;margin-bottom:0.5rem">Tree #${10000 + totalTrees} Planted</div>
        <div style="color:#999">${species} • ${location}</div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px">
        <div style="font-weight:600;margin-bottom:1rem">🎁 Rewards Earned</div>
        <div style="display:grid;gap:1rem">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span>Reward Points</span>
            <strong style="color:var(--accent);font-size:1.5rem">+${points}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span>Progress to Free Refill</span>
            <strong style="color:var(--accent)">${Math.floor((points/500)*100)}%</strong>
          </div>
          <div style="height:8px;background:#333;border-radius:4px;overflow:hidden;grid-column:1/-1">
            <div style="width:${(points/500)*100}%;height:100%;background:var(--accent);transition:width 0.5s"></div>
          </div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.5rem">
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">${totalTrees}</div>
          <div style="font-size:0.9rem;color:#999;margin-top:0.5rem">Your Total Trees</div>
        </div>
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">${(totalTrees * 22).toFixed(0)}</div>
          <div style="font-size:0.9rem;color:#999;margin-top:0.5rem">kg CO₂/year</div>
        </div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1rem;background:rgba(0,255,136,0.05);border-radius:8px;border-left:3px solid var(--accent)">
        <div style="font-weight:600;margin-bottom:0.5rem">📍 Tree Tracking</div>
        <div style="color:#ddd;font-size:0.95rem">Your tree is being monitored via IoT sensors. GPS coordinates and growth data will be available in your dashboard within 48 hours.</div>
      </div>
      
      <div style="margin-top:1rem;font-size:0.85rem;color:#666;text-align:center">
        Partner: Kenya Forest Service | Verified: ${new Date().toLocaleDateString()}
      </div>
    </div>
  `;
}
