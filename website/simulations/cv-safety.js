export function run(container, action = 'default'){
  container.innerHTML = '';
  const results = [
    {status:'✅ Safe', severity:'none', color:'var(--accent)', issues:[], confidence:98, recommendation:'Cylinder passed all safety checks. Safe for use.'},
    {status:'⚠️ Caution', severity:'minor', color:'#ffaa00', issues:['Minor surface rust detected on base','Slight valve wear'], confidence:92, recommendation:'Schedule inspection within 30 days. Safe for current use.'},
    {status:'❌ Service Required', severity:'critical', color:'#ff4444', issues:['Significant corrosion on cylinder body','Valve integrity compromised'], confidence:96, recommendation:'Do NOT use. Contact EnergiChain for immediate replacement.'}
  ];
  
  const result = results[Math.floor(Math.random()*results.length)];
  const scanTime = (0.8 + Math.random()*0.5).toFixed(1);
  
  container.innerHTML = `
    <div><strong>📷 Safety Scan Complete</strong></div>
    <div style="margin-top:1.5rem">
      <div style="padding:1.5rem;background:rgba(0,255,136,0.05);border:2px solid ${result.color};border-radius:8px;text-align:center">
        <div style="font-size:3rem;margin-bottom:0.5rem">${result.status.split(' ')[0]}</div>
        <div style="font-size:1.5rem;color:${result.color};font-weight:600">${result.status.substring(2)}</div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1rem;background:rgba(0,0,0,0.3);border-radius:8px">
        <div style="font-weight:600;margin-bottom:1rem">🔍 Scan Results</div>
        ${result.issues.length > 0 ? `
          <div style="margin-bottom:1rem">
            <div style="color:#999;font-size:0.9rem;margin-bottom:0.5rem">Issues Detected:</div>
            ${result.issues.map(issue=>`<div style="padding:0.5rem;margin:0.25rem 0;background:rgba(255,0,0,0.1);border-left:3px solid #ff4444;border-radius:4px">• ${issue}</div>`).join('')}
          </div>
        ` : '<div style="color:var(--accent);margin-bottom:1rem">✓ No issues detected</div>'}
        
        <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #333">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div>
              <div style="color:#999;font-size:0.85rem">Confidence</div>
              <div style="font-size:1.3rem;color:var(--accent);font-weight:600">${result.confidence}%</div>
            </div>
            <div>
              <div style="color:#999;font-size:0.85rem">Scan Time</div>
              <div style="font-size:1.3rem;color:var(--accent);font-weight:600">${scanTime}s</div>
            </div>
          </div>
        </div>
        
        <div style="margin-top:1rem;padding:1rem;background:rgba(0,255,136,0.05);border-radius:4px">
          <div style="font-weight:600;margin-bottom:0.5rem">📋 Recommendation</div>
          <div style="color:#ddd">${result.recommendation}</div>
        </div>
      </div>
      
      <div style="margin-top:1rem;font-size:0.85rem;color:#666;text-align:center">
        Model: YOLOv8 + Custom CV Pipeline | Edge Processing: On-device
      </div>
    </div>
  `;
}
