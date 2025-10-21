export function run(container, action = 'default'){
  container.innerHTML = '';
  const convos = [
    [
      {from:'Customer', msg:'Nataka gas delivery Nairobi CBD', time:'10:23 AM'},
      {from:'EnergiBot', msg:'Karibu! 🎯 Ninakuelewa. Je, unahitaji silindia ya kilo ngapi?', time:'10:23 AM'},
      {from:'Customer', msg:'13kg', time:'10:24 AM'},
      {from:'EnergiBot', msg:'Sawa! Silindia ya 13kg - KES 3,450. Delivery leo saa 4pm. Confirm order?', time:'10:24 AM'}
    ],
    [
      {from:'Customer', msg:'How do I check cylinder safety?', time:'2:15 PM'},
      {from:'EnergiBot', msg:'I can help with that! Use our CV Scanner feature: Open app → Scan → Point camera at cylinder. Takes 10 seconds! 📷', time:'2:15 PM'},
      {from:'Customer', msg:'Thanks', time:'2:16 PM'},
      {from:'EnergiBot', msg:'Happy to help! Remember: Check for rust, dents, or damage. Safety first! 🛡️', time:'2:16 PM'}
    ]
  ];
  
  const selected = convos[Math.floor(Math.random()*convos.length)];
  const stats = {
    responseTime: '1.2s',
    satisfaction: '4.8/5',
    languages: '3 (EN, SW, Sheng)'
  };
  
  container.innerHTML = `
    <div><strong>💬 Live Conversation</strong></div>
    <div style="margin-top:1rem;max-height:300px;overflow-y:auto;padding:1rem;background:rgba(0,0,0,0.3);border-radius:8px">
      ${selected.map(msg=>`
        <div style="margin:0.75rem 0">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem">
            <strong style="color:${msg.from==='Customer'?'#fff':'var(--accent)'}">${msg.from}</strong>
            <span style="font-size:0.75rem;color:#666">${msg.time}</span>
          </div>
          <div style="padding:0.75rem;background:${msg.from==='Customer'?'#2a2a2a':'rgba(0,255,136,0.1)'};border-radius:8px;border:1px solid ${msg.from==='Customer'?'#333':'rgba(0,255,136,0.3)'}">
            ${msg.msg}
          </div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,255,136,0.05);border-radius:8px">
      <div style="font-weight:600;margin-bottom:1rem">🤖 Assistant Performance</div>
      <div style="display:grid;gap:0.75rem">
        <div style="display:flex;justify-content:space-between">
          <span>Avg Response Time</span>
          <strong style="color:var(--accent)">${stats.responseTime}</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span>Customer Satisfaction</span>
          <strong style="color:var(--accent)">${stats.satisfaction}</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span>Languages Supported</span>
          <strong style="color:var(--accent)">${stats.languages}</strong>
        </div>
      </div>
      <div style="margin-top:1rem;font-size:0.85rem;color:#999">
        Platform: WhatsApp Business API | NLP: Custom Swahili Model | Availability: 24/7
      </div>
    </div>
  `;
}
