document.addEventListener("mouseup",async t=>{var o;const e=(o=window.getSelection())==null?void 0:o.toString().trim();if(e&&e.length>10){const n={type:"CONTEXT_CAPTURED",data:{selectedText:e,title:document.title,url:window.location.href,snippet:e.substring(0,200)+(e.length>200?"...":""),timestamp:Date.now()}};try{await chrome.runtime.sendMessage(n),console.log("MuseFlow: Context captured and sent to background")}catch(r){console.error("MuseFlow: Error sending context to background:",r)}}});chrome.runtime.onMessage.addListener((t,e,o)=>(t.type==="AI_RESPONSE"&&(console.log("MuseFlow: AI response received:",t.response),s(t.response)),!0));function s(t){var o;const e=document.createElement("div");e.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1f2937;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `,e.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #60a5fa;">MuseFlow AI</strong>
      <button id="close-overlay" style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div style="max-height: 200px; overflow-y: auto;">${t}</div>
  `,document.body.appendChild(e),(o=e.querySelector("#close-overlay"))==null||o.addEventListener("click",()=>{e.remove()}),setTimeout(()=>{e.parentNode&&e.remove()},1e4)}
