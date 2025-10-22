function p(e,t,n){const o=t.trim();if(!o)throw new Error("Content cannot be empty");switch(e){case"summarize":return h(o);case"rewrite":return w(o);case"ideate":return g(o);default:throw new Error(`Unknown operation type: ${e}`)}}function h(e,t){let n=`Summarize this content clearly and concisely:

${e}`;return n+=`

Provide:
- A clear main summary (2-3 sentences)
- Key points in bullet format
- Important details or statistics`,n}function w(e,t){let n=`Rewrite this content to be more engaging and clear:

${e}`;return n+=`

Improve:
- Clarity and readability
- Engagement and flow
- Structure and organization
- Tone and voice`,n}function g(e,t){let n=`Generate creative ideas and suggestions based on this content:

${e}`;return n+=`

Provide:
- 💡 Creative expansion ideas
- 🎯 Practical applications
- 🔍 Related concepts to explore
- 📊 Ways to visualize or present
- 🚀 Action items or next steps`,n}async function m(e,t,n){return await new Promise(r=>setTimeout(r,1e3)),{summarize:`**Summary:**

${t.substring(0,100)}...

Key points:
• Main topic covered
• Important details highlighted
• Clear overview provided`,rewrite:`**Enhanced Version:**

${t.split(" ").map((r,s)=>s%3===0?r.toUpperCase():r).join(" ")}

This rewritten version improves clarity and engagement while maintaining the original meaning.`,ideate:`**Creative Ideas:**

💡 **Expand on this topic** - Consider diving deeper into the technical aspects
🎯 **Practical applications** - How can this be applied in real-world scenarios?
🔍 **Related concepts** - Explore connections to other related topics
📊 **Data visualization** - Create charts or diagrams to illustrate key points`,translate:`**Translation:**

${t}

[Translated content would appear here]

Note: This is a mock translation. In the full version, this would show the actual translated text based on the selected languages.`}[e]}chrome.runtime.onMessage.addListener((e,t,n)=>(e.type==="CONTEXT_CAPTURED"?u(e.data):e.type==="PROCESS_TEXT"&&x(e.data,n),!0));async function x(e,t){try{console.log("MuseFlow: Processing text from popup:",e);const n=p(e.operation,e.text),o=await m(e.operation,e.text,e.options);await d(e.operation,e.text,o),t({response:o})}catch(n){console.error("MuseFlow: Error processing text:",n),t({error:"Failed to process text"})}}async function u(e){try{console.log("MuseFlow: Processing context capture:",e);const t="summarize",n=p(t,e.selectedText),o=await m(t,e.selectedText);await d(t,e.selectedText,o);const r={type:"AI_RESPONSE",response:o};chrome.tabs.query({},s=>{s.forEach(a=>{a.id&&chrome.tabs.sendMessage(a.id,r).catch(()=>{})})})}catch(t){console.error("MuseFlow: Error processing context:",t)}}async function d(e,t,n){try{const o=`ai_cache_${Date.now()}`,r={operation:e,input:t.substring(0,500),response:n,timestamp:Date.now()};await chrome.storage.local.set({[o]:r});const s=await chrome.storage.local.get(),a=Object.entries(s).filter(([i])=>i.startsWith("ai_cache_")).sort(([,i],[,c])=>c.timestamp-i.timestamp).slice(0,3),l={};a.forEach(([i,c])=>{l[i]=c}),await chrome.storage.local.clear(),await chrome.storage.local.set(l)}catch(o){console.error("MuseFlow: Error caching response:",o)}}chrome.runtime.onInstalled.addListener(e=>{console.log("MuseFlow: Extension installed/updated:",e.reason),chrome.contextMenus.create({id:"museflow-ai",title:"Process with MuseFlow AI",contexts:["selection"]})});chrome.contextMenus.onClicked.addListener((e,t)=>{if(e.menuItemId==="museflow-ai"&&e.selectionText){const n={data:{selectedText:e.selectionText,title:(t==null?void 0:t.title)||"Unknown",url:(t==null?void 0:t.url)||"Unknown",snippet:e.selectionText.substring(0,200)+(e.selectionText.length>200?"...":""),timestamp:Date.now()}};u(n.data)}});
