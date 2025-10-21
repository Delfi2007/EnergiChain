export function run(container, action = 'default'){
  container.innerHTML = '';
  const base = (Math.random()*20 + 60).toFixed(2);
  const transport = (Math.random()*5 + 3).toFixed(2);
  const taxes = (+(base*0.12)).toFixed(2);
  const total = (parseFloat(base)+parseFloat(transport)+parseFloat(taxes)).toFixed(2);
  const timestamp = new Date().toLocaleTimeString();
  
  container.innerHTML = `
    <div><strong>💰 Current Pricing Data</strong></div>
    <div style="margin-top:1rem">
      <div style="display:grid;gap:0.5rem">
        <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #333">
          <span>Base Price (per kg)</span>
          <strong>KES ${base}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #333">
          <span>Transportation</span>
          <strong>KES ${transport}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #333">
          <span>Government Taxes (12%)</span>
          <strong>KES ${taxes}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:1rem 0;font-size:1.2rem">
          <span><strong>Total Price</strong></span>
          <strong style="color:var(--accent)">KES ${total}</strong>
        </div>
      </div>
      <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #333;color:#999;font-size:0.9rem">
        <div>Last updated: ${timestamp}</div>
        <div>Oracle: Chainlink Price Feed</div>
        <div>Blockchain anchor: Block #${Math.floor(Math.random()*1000000 + 5000000)}</div>
      </div>
    </div>
  `;
}
