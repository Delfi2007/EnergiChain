export function run(container, action = 'default'){
  container.innerHTML = '';
  
  if(action === 'issue'){
    const id = 'CYL-'+Math.random().toString(36).slice(2,9).toUpperCase();
    const txHash = '0x'+Array.from({length:64}, ()=>Math.floor(Math.random()*16).toString(16)).join('');
    container.innerHTML = `
      <div><strong>✅ NFT Successfully Issued</strong></div>
      <div style="margin-top:1rem">
        <div><strong>Cylinder ID:</strong> ${id}</div>
        <div><strong>Token Address:</strong> ${txHash.slice(0,42)}</div>
        <div><strong>Blockchain:</strong> Polygon zkEVM</div>
        <div><strong>Minted:</strong> ${new Date().toLocaleString()}</div>
        <div><strong>Status:</strong> <span style="color:var(--accent)">Active</span></div>
      </div>
    `;
  } else if(action === 'scan'){
    const id = 'CYL-'+Math.random().toString(36).slice(2,9).toUpperCase();
    const refills = Math.floor(Math.random()*15);
    container.innerHTML = `
      <div><strong>📱 QR Code Scanned</strong></div>
      <div style="margin-top:1rem">
        <div><strong>Cylinder ID:</strong> ${id}</div>
        <div><strong>Owner:</strong> Verified Customer</div>
        <div><strong>Last Inspection:</strong> ${new Date(Date.now() - Math.random()*30*24*60*60*1000).toLocaleDateString()}</div>
        <div><strong>Safety Certification:</strong> <span style="color:var(--accent)">Valid</span></div>
        <div><strong>Total Refills:</strong> ${refills}</div>
        <div><strong>Next Service Due:</strong> ${new Date(Date.now() + 45*24*60*60*1000).toLocaleDateString()}</div>
      </div>
    `;
  } else {
    const refills = Math.floor(Math.random()*20);
    const dates = Array.from({length:5}, (_,i)=> new Date(Date.now() - i*15*24*60*60*1000).toLocaleDateString());
    container.innerHTML = `
      <div><strong>📋 Cylinder History</strong></div>
      <div style="margin-top:1rem">
        <div><strong>Recent Refills:</strong></div>
        ${dates.map(d=>`<div style="padding:0.5rem 0;border-bottom:1px solid #333">• ${d} — Refill completed</div>`).join('')}
      </div>
    `;
  }
}