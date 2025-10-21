// EnergiChain platform loader
document.addEventListener('click', e=>{
  const tgt = e.target;
  if(tgt.matches('[data-sim]')){
    const resultPanel = document.querySelector('#result');
    if(!resultPanel) return;
    
    resultPanel.innerHTML = '<div style="opacity:0.6">Processing request...</div>';
    
    const moduleName = tgt.getAttribute('data-sim');
    const action = tgt.getAttribute('data-action') || 'default';
    
    import('./backend/'+moduleName+'.js')
      .then(mod=>{ 
        if(mod.run) {
          mod.run(resultPanel, action);
        }
      })
      .catch(err=>{ 
        resultPanel.innerHTML = '<div style="color:#ff4444">⚠️ Service temporarily unavailable. Please try again.</div>'; 
      });
  }
});
