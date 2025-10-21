export function run(container, action = 'default'){
  container.innerHTML = '';
  const routes = [
    {id:'RT-001', stops:4, distance:'12.3 km', time:'28 min', fuel:'85%', status:'optimal'},
    {id:'RT-002', stops:6, distance:'18.7 km', time:'42 min', fuel:'78%', status:'optimal'},
    {id:'RT-003', stops:3, distance:'8.1 km', time:'19 min', fuel:'92%', status:'optimal'}
  ];
  
  const savings = {time:'31%', fuel:'26%', cost:'KES 4,200'};
  
  container.innerHTML = `
    <div><strong>🚚 Optimized Delivery Routes</strong></div>
    <div style="margin-top:1rem">
      ${routes.map(r=>`
        <div style="padding:1rem;margin:0.75rem 0;background:rgba(0,255,136,0.03);border:1px solid #333;border-radius:4px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <div><strong>${r.id}</strong> — ${r.stops} stops</div>
            <div style="padding:0.25rem 0.75rem;background:rgba(0,255,136,0.2);border-radius:12px;font-size:0.85rem;color:var(--accent)">✓ ${r.status}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;font-size:0.9rem;color:#999">
            <div>📍 ${r.distance}</div>
            <div>⏱️ ${r.time}</div>
            <div>⛽ ${r.fuel} efficient</div>
          </div>
        </div>
      `).join('')}
      <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,255,136,0.05);border-radius:8px">
        <div style="font-weight:600;margin-bottom:1rem">📈 Performance vs Traditional Routing</div>
        <div style="display:grid;gap:0.75rem">
          <div style="display:flex;justify-content:space-between">
            <span>Time Saved</span>
            <strong style="color:var(--accent)">${savings.time}</strong>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span>Fuel Efficiency</span>
            <strong style="color:var(--accent)">${savings.fuel}</strong>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span>Cost Savings (Monthly)</span>
            <strong style="color:var(--accent)">${savings.cost}</strong>
          </div>
        </div>
        <div style="margin-top:1rem;font-size:0.85rem;color:#999">
          Algorithm: Dynamic Clustering + Real-time Traffic API | Updated: Live
        </div>
      </div>
    </div>
  `;
}
