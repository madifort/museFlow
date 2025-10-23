document.addEventListener("mouseup",async e=>{var o;const t=(o=window.getSelection())==null?void 0:o.toString().trim();t&&t.length>10&&u(t,e)});chrome.runtime.onMessage.addListener((e,t,o)=>(e.type==="TRIGGER_ACTION"?l(e):e.type==="AI_RESPONSE"&&p(e),!0));async function l(e){try{const t=await chrome.runtime.sendMessage({action:e.action,text:e.text,options:{},requestId:`req_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,source:"content"});t.success?d(t.data,e.action):a(t.error||"Unknown error occurred")}catch(t){console.error("MuseFlow: Error processing action:",t),a("Failed to process request")}}function p(e){e.success?d(e.data,e.action):a(e.error||"Unknown error occurred")}function u(e,t){document.querySelectorAll(".museflow-buttons").forEach(r=>r.remove());const n=document.createElement("div");n.className="museflow-buttons",n.style.cssText=`
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
  `,[{id:"summarize",label:"Summarize",icon:"📝"},{id:"rewrite",label:"Rewrite",icon:"✏️"},{id:"ideate",label:"Ideate",icon:"💡"},{id:"translate",label:"Translate",icon:"🌐"}].forEach(r=>{const i=document.createElement("button");i.textContent=`${r.icon} ${r.label}`,i.style.cssText=`
      background: #374151;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    `,i.addEventListener("mouseenter",()=>{i.style.background="#4b5563"}),i.addEventListener("mouseleave",()=>{i.style.background="#374151"}),i.addEventListener("click",async()=>{n.remove(),await l({type:"TRIGGER_ACTION",action:r.id,text:e,source:"content"})}),n.appendChild(i)}),document.body.appendChild(n);const s=r=>{n.contains(r.target)||(n.remove(),document.removeEventListener("click",s))};setTimeout(()=>{document.addEventListener("click",s)},100)}function d(e,t){var c;const o=document.createElement("div");o.className="museflow-overlay",o.style.cssText=`
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
  `;let n="";typeof e=="string"?n=e:e.summary?n=e.summary:e.rewrittenText?n=e.rewrittenText:e.ideas&&Array.isArray(e.ideas)?n=e.ideas.map((s,r)=>`${r+1}. ${s.title||"Idea"}
${s.description||""}`).join(`

`):e.translatedText?n=e.translatedText:n=JSON.stringify(e,null,2),o.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #60a5fa;">MuseFlow ${t.charAt(0).toUpperCase()+t.slice(1)}</strong>
      <button id="close-overlay" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div style="max-height: 400px; overflow-y: auto;">${n}</div>
  `,document.body.appendChild(o),(c=o.querySelector("#close-overlay"))==null||c.addEventListener("click",()=>{o.remove()}),setTimeout(()=>{o.parentNode&&o.remove()},15e3)}function a(e){var o;const t=document.createElement("div");t.style.cssText=`
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
  `,document.body.appendChild(t),(o=t.querySelector("#close-overlay"))==null||o.addEventListener("click",()=>{t.remove()}),setTimeout(()=>{t.parentNode&&t.remove()},5e3)}
