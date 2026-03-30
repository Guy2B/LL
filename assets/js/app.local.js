
import { getImageData, computeStatsLab, localVarianceL, laplaceMagnitude, spotIndex, buildOvalMask } from './imgproc.js';

const qs = (q)=>document.querySelector(q);
const qsa = (q)=>document.querySelectorAll(q);

function setStep(n){ qsa('.step').forEach((s,i)=> s.classList.toggle('active', i===n-1)); qsa('.steps li').forEach((s,i)=> s.classList.toggle('active', i< n)); }
function enable(el, ok){ if(el) el.disabled = !ok; }

// --- GDPR must run first ---
(function gdprGate(){
  document.addEventListener('DOMContentLoaded', ()=>{
    const modal = qs('#gdpr');
    if(!sessionStorage.getItem('gdpr')){
      modal.classList.remove('hidden');
      qs('#gdprAccept').addEventListener('click', ()=>{
        sessionStorage.setItem('gdpr','1');
        modal.classList.add('hidden');
        setStep(1);
      });
    } else {
      setStep(1);
    }
  });
})();

// --- Camera helpers (robust) ---
let currentFacing='user'; let stream=null; let imgReady=false;
async function startCamera(){
  try{
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
      throw new Error('getUserMedia nicht verfügbar');
    const s = await navigator.mediaDevices.getUserMedia({ video:{ facingMode: currentFacing }, audio:false });
    stream = s; const v=qs('#video'); v.srcObject = stream; await v.play();
    enable(qs('#btnCapture'), true);
    qs('#permMsg').classList.add('hidden');
  }catch(e){
    console.warn('Camera error:', e); qs('#permMsg').classList.remove('hidden');
    // Visueller Hinweis: Upload-Button betonen
    const lbl=qs('#lblUpload'); if(lbl) lbl.style.boxShadow='0 0 0 3px rgba(200,163,74,.35)';
  }
}
async function flipCamera(){ currentFacing = (currentFacing==='user')?'environment':'user'; await startCamera(); }
function stopCamera(){ if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } enable(qs('#btnCapture'), false); }

function drawVideoToCanvas(){ const v=qs('#video'); const c=qs('#canvas'); const ctx=c.getContext('2d'); const ar=v.videoWidth/v.videoHeight; const cw=c.width,ch=c.height; let dw=cw,dh=cw/ar; if(dh<ch){ dh=ch; dw=dh*ar; } const dx=(cw-dw)/2, dy=(ch-dh)/2; ctx.drawImage(v,dx,dy,dw,dh); }

function capture(){ drawVideoToCanvas(); const prev=qs('#previewModal'); prev.classList.remove('hidden'); const can=qs('#canvas'); const pcan=qs('#previewCan'); const pcx=pcan.getContext('2d'); pcx.drawImage(can,0,0,pcan.width,pcan.height); }
function usePhoto(){ const can=qs('#canvas'); can.toBlob(b=>{ imgReady=!!b; localStorage.setItem('lb_client_photo','1'); qs('#previewModal').classList.add('hidden'); stopCamera(); enable(qs('#btnAnalyze'), true); setStep(2); }, 'image/jpeg', 0.92); }
function retake(){ qs('#previewModal').classList.add('hidden'); }

// Upload fallback
qs('#fileInput').addEventListener('change', e=>{
  const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const img=new Image(); img.onload=()=>{
    const c=qs('#canvas'); const ctx=c.getContext('2d'); const ar=img.width/img.height; const cw=c.width,ch=c.height; let dw=cw,dh=cw/ar; if(dh<ch){ dh=ch; dw=dh*ar; } const dx=(cw-dw)/2, dy=(ch-dh)/2; ctx.drawImage(img,dx,dy,dw,dh); imgReady=true; localStorage.setItem('lb_client_photo','1'); enable(qs('#btnAnalyze'), true); setStep(2);
  }; img.src=r.result; }; r.readAsDataURL(f);
});

// Offline analyze
function scale01(v,a,b){ return Math.max(0, Math.min(1, (v-a)/(b-a) )); }
function deriveInsights({tex,pore,spot,red}){
  const di=[], ac=[], av=[]; let sum='Ausgewogenes Hautbild.';
  if(tex>0.55){ di.push('Hohe Textur (Rauigkeit)'); ac.push('PHA','Niacinamide'); }
  if(pore>0.55){ di.push('Betontere Poren'); ac.push('BHA','Retinal'); }
  if(spot>0.45){ di.push('Flecken / Unregelmäßigkeiten'); ac.push('Azelaic Acid','Vitamin C'); }
  if(red>0.50){ di.push('Rötungstendenz'); ac.push('Panthenol','Centella'); av.push('starke Duftstoffe'); }
  if(!di.length){ di.push('Keine markanten Auffälligkeiten'); }
  if(tex>0.6 && pore>0.6) sum='Unruhige Textur mit betonten Poren.'; if(red>0.6) sum='Rötung im Zentrum sichtbar.';
  return { diagnostics:[...new Set(di)], actives:[...new Set(ac)], avoid:[...new Set(av)], summary:sum };
}

async function analyze(){
  if(!imgReady){ alert('Bitte zuerst ein Foto aufnehmen oder hochladen.'); return; }
  qs('#analysisWrap').classList.remove('hidden');
  const can=qs('#canvas'); const data=getImageData(can); const w=can.width,h=can.height; const mask=buildOvalMask(w,h);
  const stats=computeStatsLab(data, mask); const texVar=localVarianceL(data, mask, 4); const poreMag=laplaceMagnitude(data, mask); const spotIdx=spotIndex(data, mask);
  const tex=scale01(texVar,5,18), pore=scale01(poreMag,2.5,10), spot=scale01(spotIdx,0.05,0.22), red=scale01((stats.meanA+10)/40,0.35,0.85);
  const health = 1 - (0.30*tex + 0.30*pore + 0.25*spot + 0.15*red); const score=Math.max(0,Math.min(100,Math.round(health*100)));
  const {summary, diagnostics, actives, avoid} = deriveInsights({tex,pore,spot,red});
  // render gauge & lists
  const len=157, off=len - (score/100)*len; qs('#gArc').style.strokeDashoffset=String(off); qs('#score').textContent=String(score); qs('#summary').textContent=summary;
  const fill=(sel,arr)=>{ const ul=qs(sel); ul.innerHTML=''; (arr||[]).forEach(t=>{ const li=document.createElement('li'); li.textContent=t; ul.appendChild(li); }); };
  fill('#diagnostics', diagnostics); fill('#actives', actives); fill('#avoid', avoid);
  const photoSummary=(stats.meanL>65?'hell ausgeleuchtet': (stats.meanL<35?'eher dunkel':'ausreichend Licht'));
  const premiumUpsell= score<75? 'Premium Facial mit PHA/BHA und LED empfohlen.' : 'Optional: Premium Pflege zur Erhaltung.';
  localStorage.setItem('lb_client_analysis', JSON.stringify({score,summary,diagnostics,actives,avoid,photoSummary,premiumUpsell}));
}

// Wizard & PayPal (unchanged minimal)
let wizIndex=1; const wizTotal=6; function showWiz(i){ qsa('.wiz-step').forEach(el=> el.classList.toggle('active', Number(el.dataset.step)===i)); }
function nextWiz(){ if(wizIndex<wizTotal){ wizIndex++; showWiz(wizIndex);} else { setStep(4); /* loadPayPal optional */ } }
function prevWiz(){ if(wizIndex>1){ wizIndex--; showWiz(wizIndex);} }
function collectWizard(){ const f=new FormData(qs('#wizForm')); const allergies=[...qs('#wizForm').querySelectorAll('input[name="allergies"]:checked')].map(i=>i.value); const obj=Object.fromEntries(f.entries()); obj.allergies=allergies; localStorage.setItem('lb_client_wizard', JSON.stringify(obj)); }

// Wireup after DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  // buttons
  qs('#btnStartCam').addEventListener('click', startCamera);
  qs('#btnFlipCam').addEventListener('click', flipCamera);
  qs('#btnCapture').addEventListener('click', capture);
  qs('#btnUsePhoto').addEventListener('click', usePhoto);
  qs('#btnRetake').addEventListener('click', retake);
  qs('#btnAnalyze').addEventListener('click', analyze);
  qs('#btnToStep3').addEventListener('click', ()=>{ setStep(3); showWiz(1); });
  qs('#wizNext').addEventListener('click', ()=>{ collectWizard(); nextWiz(); });
  qs('#wizPrev').addEventListener('click', ()=>{ prevWiz(); });
});
