function p(e,t,n){const o=t.trim();if(!o)throw new Error("Content cannot be empty");switch(e){case"summarize":return d(o);case"rewrite":return u(o);case"ideate":return h(o);default:throw new Error(`Unknown operation type: ${e}`)}}function d(e,t){let n=`Summarize this content clearly and concisely:

${e}`;return n+=`

Provide:
- A clear main summary (2-3 sentences)
- Key points in bullet format
- Important details or statistics`,n}function u(e,t){let n=`Rewrite this content to be more engaging and clear:

${e}`;return n+=`

Improve:
- Clarity and readability
- Engagement and flow
- Structure and organization
- Tone and voice`,n}function h(e,t){let n=`Generate creative ideas and suggestions based on this content:

${e}`;return n+=`

Provide:
- 💡 Creative expansion ideas
- 🎯 Practical applications
- 🔍 Related concepts to explore
- 📊 Ways to visualize or present
- 🚀 Action items or next steps`,n}async function w(e,t){return await new Promise(o=>setTimeout(o,1e3)),{summarize:`**Summary:**

${t.substring(0,100)}...

Key points:
• Main topic covered
• Important details highlighted
• Clear overview provided`,rewrite:`**Enhanced Version:**

${t.split(" ").map((o,r)=>r%3===0?o.toUpperCase():o).join(" ")}

This rewritten version improves clarity and engagement while maintaining the original meaning.`,ideate:`**Creative Ideas:**

💡 **Expand on this topic** - Consider diving deeper into the technical aspects
🎯 **Practical applications** - How can this be applied in real-world scenarios?
🔍 **Related concepts** - Explore connections to other related topics
📊 **Data visualization** - Create charts or diagrams to illustrate key points`}[e]}chrome.runtime.onMessage.addListener((e,t,n)=>(e.type==="CONTEXT_CAPTURED"&&m(e.data),!0));async function m(e){try{console.log("MuseFlow: Processing context capture:",e);const t="summarize",n=p(t,e.selectedText),o=await w(t,e.selectedText);await g(t,e.selectedText,o);const r={type:"AI_RESPONSE",response:o};chrome.tabs.query({},i=>{i.forEach(a=>{a.id&&chrome.tabs.sendMessage(a.id,r).catch(()=>{})})})}catch(t){console.error("MuseFlow: Error processing context:",t)}}async function g(e,t,n){try{const o=`ai_cache_${Date.now()}`,r={operation:e,input:t.substring(0,500),response:n,timestamp:Date.now()};await chrome.storage.local.set({[o]:r});const i=await chrome.storage.local.get(),a=Object.entries(i).filter(([s])=>s.startsWith("ai_cache_")).sort(([,s],[,c])=>c.timestamp-s.timestamp).slice(0,3),l={};a.forEach(([s,c])=>{l[s]=c}),await chrome.storage.local.clear(),await chrome.storage.local.set(l)}catch(o){console.error("MuseFlow: Error caching response:",o)}}chrome.runtime.onInstalled.addListener(e=>{console.log("MuseFlow: Extension installed/updated:",e.reason),chrome.contextMenus.create({id:"museflow-ai",title:"Process with MuseFlow AI",contexts:["selection"]})});chrome.contextMenus.onClicked.addListener((e,t)=>{if(e.menuItemId==="museflow-ai"&&e.selectionText){const n={data:{selectedText:e.selectionText,title:(t==null?void 0:t.title)||"Unknown",url:(t==null?void 0:t.url)||"Unknown",snippet:e.selectionText.substring(0,200)+(e.selectionText.length>200?"...":""),timestamp:Date.now()}};m(n.data)}});
