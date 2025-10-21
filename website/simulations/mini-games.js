export function run(container, action = 'default'){
  container.innerHTML = '';
  const score = Math.floor(Math.random()*30 + 70);
  const badge = score > 90 ? '🏆 Master' : score > 75 ? '⭐ Expert' : '🎯 Pro';
  const xp = score * 10;
  const level = Math.floor(xp / 500) + 1;
  const nextLevel = (level * 500) - (xp % 500);
  
  container.innerHTML = `
    <div><strong>🎮 Learning Module Complete</strong></div>
    <div style="margin-top:1.5rem">
      <div style="padding:2rem;background:linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,255,136,0.05));border-radius:12px;text-align:center;border:1px solid rgba(0,255,136,0.3)">
        <div style="font-size:4rem;margin-bottom:0.5rem">${badge.split(' ')[0]}</div>
        <div style="font-size:1.5rem;color:var(--accent);font-weight:600;margin-bottom:0.5rem">Badge Unlocked!</div>
        <div style="font-size:1.2rem;color:#ddd">${badge}</div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-top:1.5rem">
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">${score}%</div>
          <div style="font-size:0.85rem;color:#999;margin-top:0.5rem">Score</div>
        </div>
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">+${xp}</div>
          <div style="font-size:0.85rem;color:#999;margin-top:0.5rem">XP</div>
        </div>
        <div style="padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">Lv.${level}</div>
          <div style="font-size:0.85rem;color:#999;margin-top:0.5rem">Level</div>
        </div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
          <span style="font-weight:600">Progress to Level ${level+1}</span>
          <span style="color:var(--accent);font-weight:600">${nextLevel} XP remaining</span>
        </div>
        <div style="height:12px;background:#333;border-radius:6px;overflow:hidden">
          <div style="width:${((xp % 500)/500)*100}%;height:100%;background:linear-gradient(90deg,var(--accent),#00cc70);transition:width 0.5s"></div>
        </div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,255,136,0.05);border-radius:8px">
        <div style="font-weight:600;margin-bottom:1rem">✅ Topics Mastered</div>
        <div style="display:grid;gap:0.5rem">
          ${['LPG Safety Basics','Cylinder Inspection','Gas Leak Detection','Fire Prevention','Emergency Response'].map(topic=>`
            <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem;background:rgba(0,0,0,0.3);border-radius:4px">
              <div style="color:var(--accent);font-size:1.2rem">✓</div>
              <div>${topic}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1rem;background:rgba(0,255,136,0.05);border-radius:8px;border-left:3px solid var(--accent)">
        <div style="font-weight:600;margin-bottom:0.5rem">🎁 Reward Unlocked</div>
        <div style="color:#ddd;font-size:0.95rem">You've earned a 5% discount on your next cylinder purchase! Code: LEARN${Math.random().toString(36).slice(2,6).toUpperCase()}</div>
      </div>
      
      <div style="margin-top:1rem;font-size:0.85rem;color:#666;text-align:center">
        Continue learning to unlock more badges and discounts!
      </div>
    </div>
  `;
}
