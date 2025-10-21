export function run(container, action = 'default'){
  container.innerHTML = '';
  const deposit = (Math.random()*150 + 100).toFixed(0);
  const cylinderId = 'CYL-'+Math.random().toString(36).slice(2,9).toUpperCase();
  const txHash = '0x'+Array.from({length:64}, ()=>Math.floor(Math.random()*16).toString(16)).join('').slice(0,42);
  const refundTime = (2 + Math.random()*3).toFixed(1);
  
  container.innerHTML = `
    <div><strong>♻️ Cylinder Return Processed</strong></div>
    <div style="margin-top:1.5rem">
      <div style="padding:2rem;background:linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,255,136,0.05));border-radius:12px;text-align:center;border:1px solid rgba(0,255,136,0.3)">
        <div style="font-size:3rem;margin-bottom:0.5rem">✓</div>
        <div style="font-size:1.5rem;color:var(--accent);font-weight:600;margin-bottom:0.5rem">Deposit Refunded</div>
        <div style="font-size:3rem;color:var(--accent);font-weight:700;margin-top:1rem">KES ${deposit}</div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1.5rem;background:rgba(0,0,0,0.3);border-radius:8px">
        <div style="font-weight:600;margin-bottom:1rem">📋 Transaction Details</div>
        <div style="display:grid;gap:0.75rem;font-size:0.95rem">
          <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #333">
            <span style="color:#999">Cylinder ID</span>
            <strong>${cylinderId}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #333">
            <span style="color:#999">Deposit Amount</span>
            <strong style="color:var(--accent)">KES ${deposit}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #333">
            <span style="color:#999">Processing Time</span>
            <strong>${refundTime}s</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #333">
            <span style="color:#999">Payment Method</span>
            <strong>M-Pesa</strong>
          </div>
          <div style="padding:0.5rem 0">
            <div style="color:#999;margin-bottom:0.5rem">Blockchain TX</div>
            <div style="font-family:monospace;font-size:0.75rem;word-break:break-all;color:var(--accent)">${txHash}</div>
          </div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.5rem">
        <div style="padding:1.5rem;background:rgba(0,255,136,0.05);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">${Math.floor(Math.random()*30 + 10)}</div>
          <div style="font-size:0.9rem;color:#999;margin-top:0.5rem">Total Returns</div>
        </div>
        <div style="padding:1.5rem;background:rgba(0,255,136,0.05);border-radius:8px;text-align:center">
          <div style="font-size:2rem;color:var(--accent);font-weight:600">+50</div>
          <div style="font-size:0.9rem;color:#999;margin-top:0.5rem">Bonus Points</div>
        </div>
      </div>
      
      <div style="margin-top:1.5rem;padding:1rem;background:rgba(0,255,136,0.05);border-radius:8px;border-left:3px solid var(--accent)">
        <div style="font-weight:600;margin-bottom:0.5rem">🎉 Environmental Impact</div>
        <div style="color:#ddd;font-size:0.95rem">Thank you for participating in the circular economy! This return prevents illegal dumping and supports sustainable practices.</div>
      </div>
      
      <div style="margin-top:1rem;font-size:0.85rem;color:#666;text-align:center">
        Verified on blockchain • Instant mobile money transfer
      </div>
    </div>
  `;
}
