document.addEventListener("mouseup",async e=>{var n;const t=(n=window.getSelection())==null?void 0:n.toString().trim();t&&t.length>10&&x(t,e)});chrome.runtime.onMessage.addListener((e,t,n)=>(e.type==="TRIGGER_ACTION"?u(e):e.type==="AI_RESPONSE"&&y(e),!0));async function u(e){try{console.log("[MuseFlow] Content script handling action:",e.action);const t=new AbortController,n=setTimeout(()=>{t.abort()},1e4),o=await chrome.runtime.sendMessage({action:e.action,text:e.text,options:{},requestId:`req_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,source:"content"});clearTimeout(n),console.log("[MuseFlow] Content script received response:",o),o&&o.success?p(o.data,e.action):c((o==null?void 0:o.error)||"Unknown error occurred")}catch(t){throw console.error("[MuseFlow] Content script error processing action:",t),t.name==="AbortError"?c("Request timed out. Please try again."):c("Failed to process request"),t}}function y(e){e.success?p(e.data,e.action):c(e.error||"Unknown error occurred")}function x(e,t){document.querySelectorAll(".museflow-buttons").forEach(s=>s.remove());const o=document.createElement("div");o.className="museflow-buttons",o.style.cssText=`
    position: fixed;
    top: ${t.clientY-10}px;
    left: ${t.clientX}px;
    background: #1f2937;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    display: flex;
    gap: 4px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: opacity 0.2s ease;
    border: 2px solid #374151;
  `;let i=!1;[{id:"summarize",label:"Summarize",icon:"📝"},{id:"rewrite",label:"Rewrite",icon:"✏️"},{id:"ideate",label:"Ideate",icon:"💡"},{id:"translate",label:"Translate",icon:"🌐"}].forEach(s=>{const r=document.createElement("button");r.textContent=`${s.icon} ${s.label}`,r.style.cssText=`
      background: #374151;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    `,r.addEventListener("mouseenter",()=>{i||(r.style.background="#4b5563")}),r.addEventListener("mouseleave",()=>{i||(r.style.background="#374151")}),r.addEventListener("click",async d=>{d.preventDefault(),d.stopPropagation(),console.log("[MuseFlow] Button clicked:",s.id),i=!0,o.style.opacity="0.7",o.style.pointerEvents="none",r.textContent="⏳ Processing...",r.style.background="#6b7280";try{console.log("[MuseFlow] Calling handleTriggerAction for:",s.id),await u({type:"TRIGGER_ACTION",action:s.id,text:e,source:"content"}),console.log("[MuseFlow] Action completed successfully, removing container"),o.remove()}catch(m){console.error("[MuseFlow] Button action failed:",m),r.textContent=`${s.icon} ${s.label}`,r.style.background="#374151",o.style.opacity="1",o.style.pointerEvents="auto",i=!1}}),o.appendChild(r)}),document.body.appendChild(o);const l=s=>{if(i){console.log("[MuseFlow] Ignoring click outside - processing in progress");return}o.contains(s.target)||(console.log("[MuseFlow] Removing buttons - clicked outside"),o.remove(),document.removeEventListener("click",l))};setTimeout(()=>{document.addEventListener("click",l)},100)}function p(e,t){var i;const n=document.createElement("div");n.className="museflow-overlay",n.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1f2937;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    max-height: 500px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    overflow-y: auto;
  `;let o="";typeof e=="string"?o=e:e.summary?o=e.summary:e.rewrittenText?o=e.rewrittenText:e.ideas&&Array.isArray(e.ideas)?o=e.ideas.map((a,l)=>`${l+1}. ${a.title||"Idea"}
${a.description||""}`).join(`

`):e.translatedText?o=e.translatedText:o=JSON.stringify(e,null,2),n.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #60a5fa;">MuseFlow ${t.charAt(0).toUpperCase()+t.slice(1)}</strong>
      <button id="close-overlay" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div style="max-height: 400px; overflow-y: auto;">${o}</div>
  `,document.body.appendChild(n),(i=n.querySelector("#close-overlay"))==null||i.addEventListener("click",()=>{n.remove()}),setTimeout(()=>{n.parentNode&&n.remove()},15e3)}function c(e){var n;const t=document.createElement("div");t.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc2626;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `,t.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #fca5a5;">MuseFlow Error</strong>
      <button id="close-overlay" style="background: none; border: none; color: #fca5a5; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div>${e}</div>
  `,document.body.appendChild(t),(n=t.querySelector("#close-overlay"))==null||n.addEventListener("click",()=>{t.remove()}),setTimeout(()=>{t.parentNode&&t.remove()},5e3)}
