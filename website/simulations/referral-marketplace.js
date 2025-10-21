export function run(container, action = 'default'){
  container.innerHTML = '';
  const code = 'EC-'+Math.random().toString(36).slice(2,8).toUpperCase();
  const referrals = Math.floor(Math.random()*25 + 5);
  const earnings = (referrals * 85 * 0.05).toFixed(0);
  const rank = Math.floor(Math.random()*150) + 1;
  
  container.innerHTML = `
    <div><strong>🎯 Ambassador Dashboard</strong></div>
    <div style="margin-top:1.5rem">
      <div style="padding:2rem;background:linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,255,136,0.05));border-radius:12px;text-align:center;border:1px solid rgba(0,255,136,0.3)">
        <div style="font-size:0.9rem;color:#999;margin-bottom:0.5rem">Your Referral Code</div>
        <div style="font-size:2.5rem;color:var(--accent);font-weight:700;letter-spacing:0.1em;margin-bottom:1rem">${code}</div>
        <button style="padding:0.75rem 2rem;background:var(--accent);color:#000;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="navigator.clipboard.writeText('${code}');alert('Code copied!')">
          📋 Copy Code
        </button>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.5rem">
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">${referrals}</div>
          <div style="font-size:0.85rem;color:#999;margin-top:0.5rem">Referrals</div>
        </div>
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">${earnings}</div>
          <div style="font-size:0.85rem;color:#999;margin-top:0.5rem">KES Earned</div>
        </div>
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">#${rank}</div>
          <div style="font-size:0.85rem;color:#999;margin-top:0.5rem">Leaderboard</div>
        </div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px">
        <div style="font-weight:600;margin-bottom:1rem">💰 Commission Structure</div>
        <div style="display:grid;gap:0.75rem">
          <div style="display:flex;justify-content:space-between;padding:0.75rem;background:rgba(0,255,136,0.05);border-radius:4px">
            <span>Per 6kg Cylinder</span>
            <strong style="color:var(--accent)">KES 80</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.75rem;background:rgba(0,255,136,0.05);border-radius:4px">
            <span>Per 13kg Cylinder</span>
            <strong style="color:var(--accent)">KES 150</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.75rem;background:rgba(0,255,136,0.05);border-radius:4px">
            <span>Monthly Bonus (25+ refs)</span>
            <strong style="color:var(--accent)">KES 5,000</strong>
          </div>
        </div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,255,136,0.05);border-radius:8px">
        <div style="font-weight:600;margin-bottom:1rem">🏆 Campus Leaderboard (Top 5)</div>
        <div style="display:grid;gap:0.5rem">
          ${[
            {name:'Sarah M.', refs:47, campus:'UoN'},
            {name:'David K.', refs:42, campus:'JKUAT'},
            {name:'Grace W.', refs:38, campus:'KU'},
            {name:'You', refs:referrals, campus:'Your Campus', highlight:true},
            {name:'Peter O.', refs:29, campus:'USIU'}
          ].slice(0,5).map((amb,i)=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:${amb.highlight?'rgba(0,255,136,0.1)':'rgba(0,0,0,0.2)'};border-radius:4px;${amb.highlight?'border:1px solid var(--accent)':''}">
              <div style="display:flex;align-items:center;gap:1rem">
                <div style="font-size:1.2rem;font-weight:700;color:${i<3?'var(--accent)':'#666'}">#${i+1}</div>
                <div>
                  <div style="font-weight:600;${amb.highlight?'color:var(--accent)':''}">${amb.name}</div>
                  <div style="font-size:0.8rem;color:#999">${amb.campus}</div>
                </div>
              </div>
              <div style="font-weight:700;color:var(--accent)">${amb.refs}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-top:1rem;font-size:0.85rem;color:#666;text-align:center">
        Verified Student Ambassador • Commission paid weekly via M-Pesa
      </div>
    </div>
  `;
}
