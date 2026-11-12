// ════ STATE ════
let tablets = [], students = [], teachers = [];
let filt = 'all';
let stuFilt = 'all';
const ph = {};

// scan state
let scanStream1=null,scanStream2=null,scanStreamLookup=null;
let scanAF1=null,scanAF2=null,scanAFLookup=null;
let scannedTab=null,scannedPerson=null;
let manualType='student';
let useManual=false;
let scanMode='issue';

// ════ PERSIST (Firestore) ════
function renderAll(){updateStats(); renderTabList(); renderStuList(); renderTchList(); refillSels(); updateSummary();}
function persist(){renderAll(); pushChanges();}

function updateSummary(){
  const ts=document.getElementById('sum-tabs');
  const ss=document.getElementById('sum-stu');
  const tc=document.getElementById('sum-tch');
  if(ts) ts.textContent=tablets.length+' ක් ('+tablets.filter(t=>t.assignee).length+' ලබාදී)';
  if(ss) ss.textContent=students.length+' ක්';
  if(tc) tc.textContent=teachers.length+' ක්';
}

// ════ EXPORT ════
function markExport(){
  const now=new Date().toLocaleString('si-LK');
  localStorage.setItem('denzil_v4_lastExport',now);
  const el=document.getElementById('lastExportTime');
  if(el) el.textContent=now;
  showToast('📤 Export සාර්ථකයි','ok');
}

function updateStats(){
  const tot=tablets.length, used=tablets.filter(t=>t.assignee).length;
  document.getElementById('sTot').textContent=tot;
  document.getElementById('sAv').textContent=tot-used;
  document.getElementById('sUs').textContent=used;
  document.getElementById('hCnt').textContent=tot+' ටැබ්';
  document.getElementById('stuBdg').textContent=students.length;
  document.getElementById('tchBdg').textContent=teachers.length;
}

// ════ TABLET INVENTORY ════
function setF(f,el){
  filt=f;
  document.querySelectorAll('.fpill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on'); renderTabList();
}
function renderTabList(){
  const q=(document.getElementById('searchQ').value||'').toLowerCase();
  const list=tablets.filter(t=>{
    const h=(t.id+t.ts+t.ks+(t.assignee?.name||'')).toLowerCase();
    if(!h.includes(q)) return false;
    if(filt==='available') return !t.assignee;
    if(filt==='assigned') return !!t.assignee;
    if(filt==='student') return t.assignee?.type==='student';
    if(filt==='teacher') return t.assignee?.type==='teacher';
    return true;
  });
  document.getElementById('invBdg').textContent=list.length;
  const el=document.getElementById('tabList');
  if(!list.length){el.innerHTML='<div class="empty"><div class="ei">📭</div><p>ටැබ්ලට් හමු නොවිණි</p></div>';return;}
  el.innerHTML=list.map(t=>{
    const asgn=!!t.assignee;
    const th=t.photo?`<div class="tc-thumb"><img src="${t.photo}"></div>`:'<div class="tc-thumb">📱</div>';
    const nm=asgn?t.assignee.name:'ලබා ගත හැකිය';
    const sb=asgn?(t.assignee.type==='student'?'👦 '+t.assignee.grade:'👩‍🏫 '+t.assignee.phone):'SN: '+t.ts;
    const chip=asgn?'<span class="tc-chip cp">● ලබාදී ඇත</span>':'<span class="tc-chip cg">● ඇත</span>';
    return `<div class="tcard ${asgn?'t-asgn':'t-avail'}" onclick="openTabDetail('${t.id}')">
      <div class="tc-row">${th}<div class="tc-idb ${asgn?'asgn':''}">${t.id}</div>
      <div class="tc-body"><div class="tc-name">${nm}</div><div class="tc-sub">${sb}${condTxt(t)}</div></div>${chip}</div></div>`;
  }).join('');
}

// ════ SAVE TABLET ════
function saveTab(){
  const id=document.getElementById('f-id').value.trim();
  const ts=document.getElementById('f-ts').value.trim();
  const ks=document.getElementById('f-ks').value.trim();
  const eid=document.getElementById('f-eid').value;
  if(!id||!ts||!ks){showToast('ID, Tab Serial, KB Serial අවශ්‍යයි','err');return;}
  if(!eid && tablets.find(t=>t.id===id)){showToast(id+' දැනටමත් ඇත','err');return;}
  const rec={
    id,ts,ks,
    photo:ph['f-phd']||null,
    kbPhoto:ph['f-kbphd']||null,
    notes:document.getElementById('f-notes').value.trim(),
    condition:document.getElementById('f-cond').value, issue:document.getElementById('f-issue').value.trim(),
    dateAdded:new Date().toLocaleDateString('si-LK'),
    assignee:null
  };
  if(eid){
    const idx=tablets.findIndex(t=>t.id===eid);
    if(idx>=0){rec.assignee=tablets[idx].assignee; tablets[idx]=rec;}
  } else {
    tablets.push(rec);
  }
  persist(); clearTabForm(); showToast('✅ '+id+' සුරකිනු ලදී','ok');
}
function clearTabForm(){
  ['f-id','f-ts','f-ks','f-notes'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('f-eid').value=''; document.getElementById('f-cond').value='WORKING'; document.getElementById('f-issue').value='';
  document.getElementById('f-phprev').style.display='none';
  document.getElementById('f-kbphprev').style.display='none';
  document.getElementById('editBdg').style.display='none';
  document.getElementById('cancelBtn').style.display='none';
  document.getElementById('addTtl').textContent='➕ නව ටැබ්ලට් ඉන්වෙන්ටරි';
  delete ph['f-phd']; delete ph['f-kbphd'];
}
function cancelEdit(){clearTabForm();}
function startEdit(id){
  const t=tablets.find(x=>x.id===id); if(!t) return;
  closeOvDirect(); goPage('add',document.querySelectorAll('.bnav-btn')[1]);
  document.getElementById('f-id').value=t.id;
  document.getElementById('f-ts').value=t.ts;
  document.getElementById('f-ks').value=t.ks;
  document.getElementById('f-notes').value=t.notes||''; document.getElementById('f-cond').value=t.condition||'WORKING'; document.getElementById('f-issue').value=t.issue||'';
  document.getElementById('f-eid').value=t.id;
  if(t.photo){const p=document.getElementById('f-phprev');p.src=t.photo;p.style.display='block';ph['f-phd']=t.photo;}
  if(t.kbPhoto){const p=document.getElementById('f-kbphprev');p.src=t.kbPhoto;p.style.display='block';ph['f-kbphd']=t.kbPhoto;}
  document.getElementById('editBdg').style.display='block';
  document.getElementById('cancelBtn').style.display='block';
  document.getElementById('addTtl').textContent='✏️ ටැබ්ලට් සංස්කරණය';
}
function delTab(id){
  if(!confirm(id+' ටැබ්ලට් මකා දැමීමට ඒකාකාරිව ද?')) return;
  tablets=tablets.filter(t=>t.id!==id); closeOvDirect(); persist(); showToast('🗑️ '+id+' මකා දමන ලදී');
}

// ════ TABLET DETAIL MODAL ════
function openTabDetail(id){
  const t=tablets.find(x=>x.id===id); if(!t) return;
  // SINGLE combined QR containing Tab No + Tab Serial + Keyboard Serial
  const tabQR=JSON.stringify({type:'tablet',id:t.id,tabNo:t.id,tabSerial:t.ts,kbSerial:t.ks});
  const qid=id.replace(/[^a-z0-9]/gi,'_');
  let aHtml='';
  if(t.assignee){
    const a=t.assignee;
    const init=a.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const avBg=a.type==='teacher'?'background:var(--pink)':'background:var(--accent)';
    const avHtml=a.photo?`<div class="av"><img src="${a.photo}"></div>`:`<div class="av" style="${avBg}">${init}</div>`;
    const rows=a.type==='teacher'
      ?`<tr><td>දුරකථනය</td><td>${a.phone}</td></tr><tr><td>ජා.හැ.පත.</td><td>${a.nic}</td></tr>`
      :`<tr><td>ශ්‍රේණිය</td><td>${a.grade}</td></tr>`;
    aHtml=`<div class="asgn-blk">${avHtml}<div><div style="font-size:14px;font-weight:700">${a.name}</div>
      <div style="font-size:10px;color:var(--muted)">${a.type==='teacher'?'👩‍🏫 ගුරු':'👦 සිසු'} · ${a.date}</div></div></div>
      <table class="inf-tbl">${rows}<tr><td>ලබාදුන් දිනය</td><td>${a.date}</td></tr></table>`;
  }
  const personQR=t.assignee?JSON.stringify({
    type:t.assignee.type==='student'?'student':'teacher',
    name:t.assignee.name,
    ...(t.assignee.type==='student'?{grade:t.assignee.grade}:{phone:t.assignee.phone,nic:t.assignee.nic})
  }):null;

  document.getElementById('modBody').innerHTML=`
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">
      ${t.photo?`<img src="${t.photo}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:1.5px solid var(--border)">`:'<span style="font-size:42px">📱</span>'}
      <div>
        <div style="font-size:21px;font-weight:800;font-family:JetBrains Mono,monospace;color:var(--accent)">${t.id}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${t.assignee?'● '+t.assignee.name+' වෙත ලබාදී ඇත':'● ලබා ගත හැකිය'}</div>
      </div>
    </div>
    <table class="inf-tbl">
      <tr><td>Tab No</td><td style="font-family:JetBrains Mono,monospace;font-size:12px;font-weight:700">${t.id}</td></tr>
      <tr><td>Tab Serial No</td><td style="font-family:JetBrains Mono,monospace;font-size:11px">${t.ts}</td></tr>
      <tr><td>තත්වය</td><td>${COND[t.condition||'WORKING']||t.condition}${t.issue?' — '+t.issue:''}</td></tr>
      <tr><td>Keyboard Serial No</td><td style="font-family:JetBrains Mono,monospace;font-size:11px">${t.ks}</td></tr>
      ${t.kbPhoto?`<tr><td>KB Photo</td><td><img src="${t.kbPhoto}" style="width:80px;height:50px;object-fit:cover;border-radius:6px;border:1px solid var(--border)"></td></tr>`:''}
      ${t.notes?`<tr><td>සටහන</td><td>${t.notes}</td></tr>`:''}
      <tr><td>එකතු කළ දිනය</td><td>${t.dateAdded}</td></tr>
    </table>
    ${aHtml}
    <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">ටැබ් QR කේතය (Tab No + Tab SN + KB SN)</div>
    <div class="qr-card" style="max-width:200px;margin:0 auto 10px">
      <div class="qt">📱 ${t.id}</div>
      <div id="qr_tab_${qid}"></div>
      <div class="ql">Tab: ${t.ts} | KB: ${t.ks}</div>
    </div>
    ${personQR?`<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">පුද්ගල QR</div>
    <div class="qr-card" style="margin-bottom:13px"><div class="qt">${t.assignee.type==='teacher'?'👩‍🏫 ගුරු':'👦 සිසු'} QR</div><div id="qr_p_${qid}"></div><div class="ql">${t.assignee.name}</div></div>`:''}
    <div class="btn-row">
      <button class="btn btn-ghost btn-sm" onclick="printTabQR('${t.id}')">🖨️ QR Print</button>
      <button class="btn btn-green btn-sm" onclick="downloadTabQRJpeg('${t.id}')">📥 JPEG</button>
      <button class="btn btn-ghost btn-sm" onclick="startEdit('${t.id}')">✏️ Edit</button>
      ${!t.assignee
        ?`<button class="btn btn-blue btn-sm" onclick="closeOvDirect();swScanMode('issue');goPage('scan',document.querySelectorAll('.bnav-btn')[4])">📷 Scan Issue</button>`
        :`<button class="btn btn-ghost btn-sm" onclick="quickReturn('${t.id}')">↩️ Return</button>`}
      <button class="btn btn-pink btn-sm" onclick="delTab('${t.id}')">🗑️</button>
    </div>`;

  document.getElementById('ov').classList.add('open');
  setTimeout(()=>{
    genQR('qr_tab_'+qid,tabQR,160);
    if(personQR) genQR('qr_p_'+qid,personQR,120);
  },100);
}

// ════ STUDENTS ════
function swStuView(v){
  ['list','add','qr'].forEach(x=>document.getElementById('stu-'+x+'-view').style.display='none');
  document.getElementById('stu-'+v+'-view').style.display='block';
  ['sl','sa','sq'].forEach(x=>document.getElementById('sw-'+x).classList.remove('on'));
  document.getElementById('sw-s'+v[0]).classList.add('on');
  if(v==='list') renderStuList();
  if(v==='qr'){renderStuGradeFilter();renderStuQRPrint();}
}

function setStuF(f,el){
  stuFilt=f;
  document.querySelectorAll('#classFiltBar .fpill').forEach(p=>p.classList.remove('on'));
  el.classList.add('on'); renderStuList();
}

function renderClassFilters(){
  const grades=[...new Set(students.map(s=>s.grade+s.cls))].sort();
  const bar=document.getElementById('classFiltBar');
  bar.innerHTML='<button class="fpill on" onclick="setStuF(\'all\',this)">සියල්ල</button>';
  const gradeGroups=[...new Set(students.map(s=>s.grade))].sort();
  gradeGroups.forEach(g=>{
    bar.innerHTML+=`<button class="fpill" onclick="setStuF('grade_${g}',this)">Grade ${g}</button>`;
  });
}

function renderStuList(){
  renderClassFilters();
  const q=(document.getElementById('stuSearchQ').value||'').toLowerCase();
  let list=students.filter(s=>{
    const h=(s.id+s.name+s.grade+s.cls+(s.stream||'')).toLowerCase();
    if(!h.includes(q)) return false;
    if(stuFilt.startsWith('grade_')) return s.grade===stuFilt.replace('grade_','');
    return true;
  });
  document.getElementById('stuBdg').textContent=students.length;
  const el=document.getElementById('stuList');
  if(!list.length){el.innerHTML='<div class="empty"><div class="ei">👦</div><p>සිසුන් හමු නොවිණි</p></div>';return;}

  // Group by grade+class
  const groups={};
  list.forEach(s=>{const k='Grade '+s.grade+' '+s.cls;if(!groups[k])groups[k]=[];groups[k].push(s);});
  el.innerHTML=Object.keys(groups).sort().map(g=>`
    <div class="class-section">
      <div class="class-hdr">${g}<span class="class-cnt">${groups[g].length} දෙනා</span></div>
      ${groups[g].map(s=>`
        <div class="tcard s-card" onclick="openStuDetail('${s.id}')">
          <div class="tc-row">
            ${s.photo?`<div class="tc-thumb"><img src="${s.photo}"></div>`:'<div class="tc-thumb">👦</div>'}
            <div class="tc-idb stu">${s.id}</div>
            <div class="tc-body">
              <div class="tc-name">${s.name}</div>
              <div class="tc-sub">Grade ${s.grade} ${s.cls}${s.stream?' · '+s.stream:''}</div>
            </div>
            <span class="tc-chip cb">● QR ✓</span>
          </div>
        </div>`).join('')}
    </div>`).join('');
}

function autoStuId(){
  const n=students.length+1;
  return 'STU-'+String(n).padStart(3,'0');
}

function saveStu(){
  const id=document.getElementById('s-id').value.trim();
  const name=document.getElementById('s-name').value.trim();
  const grade=document.getElementById('s-grade').value;
  const cls=document.getElementById('s-class').value;
  const eid=document.getElementById('s-eid').value;
  if(!id||!name||!grade||!cls){showToast('ID, නම, ශ්‍රේණිය, කොට්ඨාශය අවශ්‍යයි','err');return;}
  if(!eid && students.find(s=>s.id===id)){showToast(id+' දැනටමත් ඇත','err');return;}
  const rec={
    id,name,grade,cls,
    stream:document.getElementById('s-stream').value,
    dob:document.getElementById('s-dob').value,
    photo:ph['s-phd']||null,
    dateAdded:new Date().toLocaleDateString('si-LK')
  };
  if(eid){const idx=students.findIndex(s=>s.id===eid);if(idx>=0)students[idx]=rec;}
  else students.push(rec);
  persist(); clearStuForm(); showToast('✅ '+name+' සිසු සුරකිනු ලදී','ok');
  swStuView('list');
}
function clearStuForm(){
  ['s-id','s-name','s-dob'].forEach(i=>document.getElementById(i).value='');
  ['s-grade','s-class','s-stream'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('s-eid').value='';
  document.getElementById('s-phprev').style.display='none';
  document.getElementById('stuEditBdg').style.display='none';
  document.getElementById('stuCancelBtn').style.display='none';
  delete ph['s-phd'];
  document.getElementById('s-id').value=autoStuId();
}
function cancelStuEdit(){clearStuForm();swStuView('list');}
function startStuEdit(id){
  const s=students.find(x=>x.id===id);if(!s) return;
  closeOvDirect();swStuView('add');
  document.getElementById('s-id').value=s.id;
  document.getElementById('s-name').value=s.name;
  document.getElementById('s-grade').value=s.grade;
  document.getElementById('s-class').value=s.cls;
  document.getElementById('s-stream').value=s.stream||'';
  document.getElementById('s-dob').value=s.dob||'';
  document.getElementById('s-eid').value=s.id;
  if(s.photo){const p=document.getElementById('s-phprev');p.src=s.photo;p.style.display='block';ph['s-phd']=s.photo;}
  document.getElementById('stuEditBdg').style.display='block';
  document.getElementById('stuCancelBtn').style.display='block';
}
function delStu(id){
  if(!confirm('සිසු '+id+' මකා දැමීමට ඒකාකාරිව ද?')) return;
  students=students.filter(s=>s.id!==id); closeOvDirect(); persist(); showToast('🗑️ සිසු මකා දමන ලදී');
}

function openStuDetail(id){
  const s=students.find(x=>x.id===id);if(!s) return;
  const qid='stu_'+id.replace(/[^a-z0-9]/gi,'_');
  const qrData=JSON.stringify({type:'student',id:s.id,name:s.name,grade:s.grade,cls:s.cls,stream:s.stream||''});
  const tab=tablets.find(t=>t.assignee?.type==='student'&&t.assignee?.name===s.name);

  document.getElementById('modBody').innerHTML=`
    <div class="sp-head">
      ${s.photo?`<div class="sp-av"><img src="${s.photo}"></div>`:`<div class="sp-av">${s.name.charAt(0)}</div>`}
      <div>
        <div class="sp-name">${s.name}</div>
        <div class="sp-role">👦 Grade ${s.grade} ${s.cls}${s.stream?' · '+s.stream:''}</div>
        <span class="sp-badge" style="background:var(--al);color:var(--accent);margin-top:5px;display:inline-block">${s.id}</span>
      </div>
    </div>
    <table class="sp-tbl">
      <tr><td>ශ්‍රේණිය</td><td>Grade ${s.grade} ${s.cls}</td></tr>
      ${s.stream?`<tr><td>Stream</td><td>${s.stream}</td></tr>`:''}
      ${s.dob?`<tr><td>ජන්ම දිනය</td><td>${s.dob}</td></tr>`:''}
      <tr><td>දත්ත ඇතුළු කළ දිනය</td><td>${s.dateAdded}</td></tr>
      ${tab?`<tr><td>ලබාගත් ටැබ්</td><td style="font-family:JetBrains Mono,monospace;font-weight:700;color:var(--accent)">${tab.id}</td></tr>`:'<tr><td>ටැබ්ලට්</td><td style="color:var(--muted)">ලබා ගෙන නොමැත</td></tr>'}
    </table>
    <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">සිසු QR කේතය</div>
    <div class="qr-card" style="max-width:180px;margin:0 auto 14px">
      <div class="qt">👦 ${s.name}</div>
      <div id="${qid}"></div>
      <div class="ql">${s.id} · Grade ${s.grade} ${s.cls}</div>
    </div>
    <div class="btn-row">
      <button class="btn btn-ghost btn-sm" onclick="printPersonQR('student','${s.id}')">🖨️ QR Print</button>
      <button class="btn btn-green btn-sm" onclick="downloadPersonQRJpeg('student','${s.id}')">📥 JPEG</button>
      <button class="btn btn-ghost btn-sm" onclick="startStuEdit('${s.id}')">✏️ Edit</button>
      <button class="btn btn-pink btn-sm" onclick="delStu('${s.id}')">🗑️</button>
    </div>`;
  document.getElementById('ov').classList.add('open');
  setTimeout(()=>genQR(qid,qrData,150),100);
}

// ════ TEACHERS ════
function swTchView(v){
  ['list','add','qr'].forEach(x=>document.getElementById('tch-'+x+'-view').style.display='none');
  document.getElementById('tch-'+v+'-view').style.display='block';
  ['tl','ta','tq'].forEach(x=>document.getElementById('sw-'+x).classList.remove('on'));
  const map={list:'tl',add:'ta',qr:'tq'};
  document.getElementById('sw-'+map[v]).classList.add('on');
  if(v==='list') renderTchList();
  if(v==='qr') renderTchQRPrint();
}

function renderTchList(){
  const q=(document.getElementById('tchSearchQ').value||'').toLowerCase();
  const list=teachers.filter(t=>(t.name+t.id+t.phone+t.subject).toLowerCase().includes(q));
  document.getElementById('tchBdg').textContent=teachers.length;
  const el=document.getElementById('tchList');
  if(!list.length){el.innerHTML='<div class="empty"><div class="ei">👩‍🏫</div><p>ගුරුවරු හමු නොවිණි</p></div>';return;}
  el.innerHTML=list.map(t=>`
    <div class="tcard t-card" onclick="openTchDetail('${t.id}')">
      <div class="tc-row">
        ${t.photo?`<div class="tc-thumb"><img src="${t.photo}"></div>`:'<div class="tc-thumb">👩‍🏫</div>'}
        <div class="tc-idb tch">${t.id}</div>
        <div class="tc-body">
          <div class="tc-name">${t.name}</div>
          <div class="tc-sub">${t.subject||''} · ${t.phone}</div>
        </div>
        <span class="tc-chip cp">● QR ✓</span>
      </div>
    </div>`).join('');
}

function autoTchId(){
  const n=teachers.length+1;
  return 'TCH-'+String(n).padStart(3,'0');
}

function saveTch(){
  const id=document.getElementById('t-id').value.trim();
  const name=document.getElementById('t-name').value.trim();
  const phone=document.getElementById('t-phone').value.trim();
  const nic=document.getElementById('t-nic').value.trim();
  const eid=document.getElementById('t-eid').value;
  if(!id||!name||!phone){showToast('ID, නම, දුරකථනය අවශ්‍යයි','err');return;}
  if(!eid && teachers.find(t=>t.id===id)){showToast(id+' දැනටමත් ඇත','err');return;}
  const rec={
    id,name,phone,nic,
    subject:document.getElementById('t-subject').value.trim(),
    photo:ph['t-phd']||null,
    dateAdded:new Date().toLocaleDateString('si-LK')
  };
  if(eid){const idx=teachers.findIndex(t=>t.id===eid);if(idx>=0)teachers[idx]=rec;}
  else teachers.push(rec);
  persist(); clearTchForm(); showToast('✅ '+name+' ගුරු සුරකිනු ලදී','ok');
  swTchView('list');
}
function clearTchForm(){
  ['t-id','t-name','t-phone','t-nic','t-subject'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('t-eid').value='';
  document.getElementById('t-phprev').style.display='none';
  document.getElementById('tchEditBdg').style.display='none';
  document.getElementById('tchCancelBtn').style.display='none';
  delete ph['t-phd'];
  document.getElementById('t-id').value=autoTchId();
}
function cancelTchEdit(){clearTchForm();swTchView('list');}
function startTchEdit(id){
  const t=teachers.find(x=>x.id===id);if(!t) return;
  closeOvDirect();swTchView('add');
  document.getElementById('t-id').value=t.id;
  document.getElementById('t-name').value=t.name;
  document.getElementById('t-phone').value=t.phone;
  document.getElementById('t-nic').value=t.nic||'';
  document.getElementById('t-subject').value=t.subject||'';
  document.getElementById('t-eid').value=t.id;
  if(t.photo){const p=document.getElementById('t-phprev');p.src=t.photo;p.style.display='block';ph['t-phd']=t.photo;}
  document.getElementById('tchEditBdg').style.display='block';
  document.getElementById('tchCancelBtn').style.display='block';
}
function delTch(id){
  if(!confirm('ගුරු '+id+' මකා දැමීමට ඒකාකාරිව ද?')) return;
  teachers=teachers.filter(t=>t.id!==id); closeOvDirect(); persist(); showToast('🗑️ ගුරු මකා දමන ලදී');
}

function openTchDetail(id){
  const t=teachers.find(x=>x.id===id);if(!t) return;
  const qid='tch_'+id.replace(/[^a-z0-9]/gi,'_');
  const qrData=JSON.stringify({type:'teacher',id:t.id,name:t.name,phone:t.phone,nic:t.nic||'',subject:t.subject||''});
  const tab=tablets.find(tb=>tb.assignee?.type==='teacher'&&tb.assignee?.name===t.name);

  document.getElementById('modBody').innerHTML=`
    <div class="sp-head">
      ${t.photo?`<div class="sp-av"><img src="${t.photo}"></div>`:`<div class="sp-av" style="background:var(--pink)">${t.name.charAt(0)}</div>`}
      <div>
        <div class="sp-name">${t.name}</div>
        <div class="sp-role">👩‍🏫 ගුරු${t.subject?' · '+t.subject:''}</div>
        <span class="sp-badge" style="background:var(--pl);color:var(--pink);margin-top:5px;display:inline-block">${t.id}</span>
      </div>
    </div>
    <table class="sp-tbl">
      <tr><td>දුරකථනය</td><td>${t.phone}</td></tr>
      ${t.nic?`<tr><td>ජා.හැ.පත.</td><td>${t.nic}</td></tr>`:''}
      ${t.subject?`<tr><td>විෂය</td><td>${t.subject}</td></tr>`:''}
      <tr><td>දත්ත ඇතුළු කළ දිනය</td><td>${t.dateAdded}</td></tr>
      ${tab?`<tr><td>ලබාගත් ටැබ්</td><td style="font-family:JetBrains Mono,monospace;font-weight:700;color:var(--accent)">${tab.id}</td></tr>`:'<tr><td>ටැබ්ලට්</td><td style="color:var(--muted)">ලබා ගෙන නොමැත</td></tr>'}
    </table>
    <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">ගුරු QR කේතය</div>
    <div class="qr-card" style="max-width:180px;margin:0 auto 14px">
      <div class="qt">👩‍🏫 ${t.name}</div>
      <div id="${qid}"></div>
      <div class="ql">${t.id} · ${t.phone}</div>
    </div>
    <div class="btn-row">
      <button class="btn btn-ghost btn-sm" onclick="printPersonQR('teacher','${t.id}')">🖨️ QR Print</button>
      <button class="btn btn-green btn-sm" onclick="downloadPersonQRJpeg('teacher','${t.id}')">📥 JPEG</button>
      <button class="btn btn-ghost btn-sm" onclick="startTchEdit('${t.id}')">✏️ Edit</button>
      <button class="btn btn-pink btn-sm" onclick="delTch('${t.id}')">🗑️</button>
    </div>`;
  document.getElementById('ov').classList.add('open');
  setTimeout(()=>genQR(qid,qrData,150),100);
}

// ════ QR HELPERS ════
function genQR(elId,data,size){
  const el=document.getElementById(elId);
  if(!el) return;
  el.innerHTML='';
  new QRCode(el,{text:data,width:size,height:size,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
}

function renderStuGradeFilter(){
  const sel=document.getElementById('stuQrGrade');
  const grades=[...new Set(students.map(s=>'Grade '+s.grade+' '+s.cls))].sort();
  sel.innerHTML='<option value="">-- සියලු ශ්‍රේණි --</option>'+grades.map(g=>`<option value="${g}">${g}</option>`).join('');
}

function renderStuQRPrint(){
  const grade=document.getElementById('stuQrGrade')?.value||'';
  const list=grade?students.filter(s=>'Grade '+s.grade+' '+s.cls===grade):students;
  const el=document.getElementById('stuQrPrintList');
  if(!list.length){el.innerHTML='<div class="empty"><div class="ei">👦</div><p>සිසුන් හමු නොවිණි</p></div>';return;}
  el.innerHTML=list.map((s,i)=>`
    <div class="qr-full-card">
      <div class="qfc-name">${s.name}</div>
      <div class="qfc-sub">${s.id} · Grade ${s.grade} ${s.cls}${s.stream?' · '+s.stream:''}</div>
      <div id="sqr_${i}"></div>
    </div>`).join('');
  setTimeout(()=>{
    list.forEach((s,i)=>{
      genQR('sqr_'+i,JSON.stringify({type:'student',id:s.id,name:s.name,grade:s.grade,cls:s.cls,stream:s.stream||''}),140);
    });
  },100);
}

function renderTchQRPrint(){
  const el=document.getElementById('tchQrPrintList');
  if(!teachers.length){el.innerHTML='<div class="empty"><div class="ei">👩‍🏫</div><p>ගුරුවරු හමු නොවිණි</p></div>';return;}
  el.innerHTML=teachers.map((t,i)=>`
    <div class="qr-full-card">
      <div class="qfc-name">${t.name}</div>
      <div class="qfc-sub">${t.id} · ${t.phone}${t.subject?' · '+t.subject:''}</div>
      <div id="tqr_${i}"></div>
    </div>`).join('');
  setTimeout(()=>{
    teachers.forEach((t,i)=>{
      genQR('tqr_'+i,JSON.stringify({type:'teacher',id:t.id,name:t.name,phone:t.phone,nic:t.nic||'',subject:t.subject||''}),140);
    });
  },100);
}

// ════ PRINT FUNCTIONS ════
function printTabQR(id){
  const t=tablets.find(x=>x.id===id);if(!t) return;
  const tabQR=JSON.stringify({type:'tablet',id:t.id,tabNo:t.id,tabSerial:t.ts,kbSerial:t.ks});
  openPrintWindow([
    {label:'📱 '+t.id,sub:'Tab SN: '+t.ts+' | KB SN: '+t.ks,data:tabQR}
  ],`QR: ${t.id}`);
}

function printAllTabQR(){
  if(!tablets.length){showToast('ටැබ්ලට් නොමැත','err');return;}
  // ONE QR per tablet containing Tab No + Tab Serial + KB Serial
  const items=tablets.map(t=>({
    label:'📱 '+t.id,
    sub:'Tab: '+t.ts+' | KB: '+t.ks,
    data:JSON.stringify({type:'tablet',id:t.id,tabNo:t.id,tabSerial:t.ts,kbSerial:t.ks})
  }));
  openPrintWindow(items,'සියලු ටැබ්ලට් QR (එක් QR = Tab No + Tab SN + KB SN)');
}

function printPersonQR(type,id){
  let person;
  if(type==='student') person=students.find(s=>s.id===id);
  else person=teachers.find(t=>t.id===id);
  if(!person) return;
  const data=type==='student'
    ?JSON.stringify({type:'student',id:person.id,name:person.name,grade:person.grade,cls:person.cls,stream:person.stream||''})
    :JSON.stringify({type:'teacher',id:person.id,name:person.name,phone:person.phone,nic:person.nic||'',subject:person.subject||''});
  openPrintWindow([{label:(type==='student'?'👦 සිසු':'👩‍🏫 ගුරු')+' QR',sub:person.id,data}],person.name);
}

function printStuQRBatch(){
  const grade=document.getElementById('stuQrGrade').value;
  const list=grade?students.filter(s=>'Grade '+s.grade+' '+s.cls===grade):students;
  if(!list.length){showToast('සිසුන් නොමැත','err');return;}
  const items=list.map(s=>({
    label:`👦 ${s.name}`,
    sub:`${s.id} · Grade ${s.grade} ${s.cls}`,
    data:JSON.stringify({type:'student',id:s.id,name:s.name,grade:s.grade,cls:s.cls,stream:s.stream||''})
  }));
  openPrintWindow(items,(grade||'සිසු')+' QR Print');
}

function printTchQRBatch(){
  if(!teachers.length){showToast('ගුරුවරු නොමැත','err');return;}
  const items=teachers.map(t=>({
    label:`👩‍🏫 ${t.name}`,
    sub:`${t.id} · ${t.phone}`,
    data:JSON.stringify({type:'teacher',id:t.id,name:t.name,phone:t.phone,nic:t.nic||'',subject:t.subject||''})
  }));
  openPrintWindow(items,'ගුරු QR Print');
}

function openPrintWindow(items,title){
  const safe=s=>s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  const win=window.open('','_blank','width=600,height=800');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>QR Print — ${title}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&family=JetBrains+Mono:wght@700&display=swap');
    body{font-family:'Noto Sans Sinhala',sans-serif;background:#fff;padding:20px;text-align:center}
    h1{font-family:'JetBrains Mono',monospace;font-size:18px;color:#1a56db;margin:0 0 16px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin:14px 0}
    .box{border:1.5px solid #c8d4f0;border-radius:11px;padding:13px 9px;background:#f8faff;page-break-inside:avoid}
    .box h3{font-size:11px;font-weight:700;color:#1a56db;margin-bottom:9px}
    .box canvas{display:block;margin:0 auto}
    .lbl{font-family:'JetBrains Mono',monospace;font-size:8px;color:#64748b;margin-top:6px;word-break:break-all;line-height:1.4}
    .school{font-size:10px;color:#94a3b8;margin-top:14px;border-top:1px solid #e2e8f0;padding-top:10px}
    @media print{body{padding:10px}.grid{gap:8px}}
  </style></head><body>
  <h1>${title}</h1>
  <div class="grid">${items.map((_,i)=>`<div class="box"><h3>${items[i].label}</h3><div id="qr${i}"></div><div class="lbl">${items[i].sub}</div></div>`).join('')}</div>
  <div class="school">බ/ඩෙන්සිල් කොබ්බෑකඩුව මහා විද්‍යාලය, හාලි ඇල · ICT ඒකකය</div>
  <script>
    const items=${JSON.stringify(items)};
    items.forEach((_,i)=>{
      new QRCode(document.getElementById('qr'+i),{text:items[i].data,width:140,height:140,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
    });
    setTimeout(()=>window.print(),900);
  <\/script></body></html>`);
  win.document.close();
}

function printQRSel(){
  const id=document.getElementById('qr-sel').value;
  if(!id){showToast('ටැබ්ලට් තෝරන්න','err');return;}
  printTabQR(id);
}

// ════ QR SCAN — LOOKUP MODE ════
function swScanMode(mode){
  scanMode=mode;
  ['issue','lookup'].forEach(m=>document.getElementById('scan-'+m+'-mode').style.display='none');
  document.getElementById('scan-'+mode+'-mode').style.display='block';
  ['t1','t2'].forEach(t=>document.getElementById('sc-'+t).classList.remove('on'));
  document.getElementById(mode==='issue'?'sc-t1':'sc-t2').classList.add('on');
  if(mode==='issue') resetScan();
  else resetLookupScan();
}

let lookupStream=null,lookupAF=null;
function startLookupScan(){
  document.getElementById('lookupScanBtn').style.display='none';
  document.getElementById('lookupResetBtn').style.display='block';
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    showToast('❌ HTTPS අවශ්‍යයි — Camera API නොමැත','err');
    document.getElementById('lookupScanBtn').style.display='block';
    document.getElementById('lookupResetBtn').style.display='none'; return;
  }
  const tryCamera=constraints=>navigator.mediaDevices.getUserMedia(constraints).then(stream=>{
    lookupStream=stream;
    const vid=document.getElementById('vidLookup');
    vid.srcObject=stream; vid.play();
    document.getElementById('camLookup').style.display='block';
    scanLookupFrame();
  });
  tryCamera({video:{facingMode:{ideal:'environment'}}})
    .catch(()=>tryCamera({video:true}))
    .catch(err=>{
      const msg=err.name==='NotAllowedError'?'Camera අවසරය ප්‍රතික්ෂේප විය':
                err.name==='NotFoundError'?'Camera හමු නොවිණි':
                err.name==='NotReadableError'?'Camera වෙනත් app එකක් භාවිත කරයි':
                'Camera error: '+err.name;
      showToast('❌ '+msg,'err'); resetLookupScan();
    });
}
function scanLookupFrame(){
  const vid=document.getElementById('vidLookup');
  const cvs=document.getElementById('cvsLookup');
  if(!lookupStream||vid.readyState<2){lookupAF=requestAnimationFrame(scanLookupFrame);return;}
  cvs.width=vid.videoWidth;cvs.height=vid.videoHeight;
  const ctx=cvs.getContext('2d');ctx.drawImage(vid,0,0);
  const img=ctx.getImageData(0,0,cvs.width,cvs.height);
  const code=jsQR(img.data,img.width,img.height);
  if(code){stopLookupScan();processLookupQR(code.data);return;}
  lookupAF=requestAnimationFrame(scanLookupFrame);
}
function stopLookupScan(){
  if(lookupStream){lookupStream.getTracks().forEach(t=>t.stop());lookupStream=null;}
  cancelAnimationFrame(lookupAF);
  document.getElementById('camLookup').style.display='none';
}
function resetLookupScan(){
  stopLookupScan();
  document.getElementById('lookupScanBtn').style.display='block';
  document.getElementById('lookupResetBtn').style.display='none';
  document.getElementById('lookupResult').innerHTML='';
}
function processLookupQR(raw){
  let data;
  try{data=JSON.parse(raw);}catch{showLookupError('වලංගු QR නොවේ');return;}

  if(data.type==='student'){
    const s=students.find(x=>x.id===data.id)||students.find(x=>x.name===data.name);
    if(s){showLookupStudent(s);}
    else showLookupError('සිසු හමු නොවිණි: '+data.name);
  } else if(data.type==='teacher'){
    const t=teachers.find(x=>x.id===data.id)||teachers.find(x=>x.name===data.name);
    if(t){showLookupTeacher(t);}
    else showLookupError('ගුරු හමු නොවිණි: '+data.name);
  } else if(data.type==='tablet'||data.type==='tablet_serial'||data.type==='keyboard_serial'){
    const t=tablets.find(x=>x.id===data.id||x.id===data.tabNo||x.ts===data.serial||x.ts===data.tabSerial||x.ks===data.kbSerial||x.ks===data.serial);
    if(t){showLookupTablet(t);}
    else showLookupError('ටැබ්ලට් හමු නොවිණි');
  } else {
    showLookupError('හඳුනාගත නොහැකි QR: '+data.type);
  }
}
function showLookupError(msg){
  document.getElementById('lookupResult').innerHTML=`
    <div style="background:var(--ol);border:1.5px solid var(--orange);border-radius:var(--radius);padding:14px;text-align:center;color:var(--orange)">
      <div style="font-size:28px;margin-bottom:6px">❌</div>
      <div style="font-weight:700">${msg}</div>
    </div>`;
}
function showLookupStudent(s){
  const tab=tablets.find(t=>t.assignee?.type==='student'&&t.assignee?.name===s.name);
  document.getElementById('lookupResult').innerHTML=`
    <div class="scan-profile">
      <div class="sp-head">
        ${s.photo?`<div class="sp-av"><img src="${s.photo}"></div>`:`<div class="sp-av">${s.name.charAt(0)}</div>`}
        <div>
          <div class="sp-name">${s.name}</div>
          <div class="sp-role">👦 Grade ${s.grade} ${s.cls}${s.stream?' · '+s.stream:''}</div>
        </div>
      </div>
      <table class="sp-tbl">
        <tr><td>ID</td><td style="font-family:JetBrains Mono,monospace;font-weight:700">${s.id}</td></tr>
        <tr><td>ශ්‍රේණිය</td><td>Grade ${s.grade} ${s.cls}</td></tr>
        ${s.stream?`<tr><td>Stream</td><td>${s.stream}</td></tr>`:''}
        ${s.dob?`<tr><td>ජන්ම දිනය</td><td>${s.dob}</td></tr>`:''}
        ${tab?`<tr><td>ලබාගත් ටැබ්</td><td style="font-family:JetBrains Mono,monospace;font-weight:700;color:var(--accent)">${tab.id}</td></tr>`:'<tr><td>ටැබ්ලට්</td><td style="color:var(--muted)">ලබා ගෙන නොමැත</td></tr>'}
        <tr><td>ඇතුළු කළ දිනය</td><td>${s.dateAdded}</td></tr>
      </table>
    </div>`;
}
function showLookupTeacher(t){
  const tab=tablets.find(tb=>tb.assignee?.type==='teacher'&&tb.assignee?.name===t.name);
  document.getElementById('lookupResult').innerHTML=`
    <div class="scan-profile">
      <div class="sp-head">
        ${t.photo?`<div class="sp-av"><img src="${t.photo}"></div>`:`<div class="sp-av" style="background:var(--pink)">${t.name.charAt(0)}</div>`}
        <div>
          <div class="sp-name">${t.name}</div>
          <div class="sp-role">👩‍🏫 ගුරු${t.subject?' · '+t.subject:''}</div>
        </div>
      </div>
      <table class="sp-tbl">
        <tr><td>ID</td><td style="font-family:JetBrains Mono,monospace;font-weight:700">${t.id}</td></tr>
        <tr><td>දුරකථනය</td><td>${t.phone}</td></tr>
        ${t.nic?`<tr><td>ජා.හැ.පත.</td><td>${t.nic}</td></tr>`:''}
        ${t.subject?`<tr><td>විෂය</td><td>${t.subject}</td></tr>`:''}
        ${tab?`<tr><td>ලබාගත් ටැබ්</td><td style="font-family:JetBrains Mono,monospace;font-weight:700;color:var(--accent)">${tab.id}</td></tr>`:'<tr><td>ටැබ්ලට්</td><td style="color:var(--muted)">ලබා ගෙන නොමැත</td></tr>'}
      </table>
    </div>`;
}
function showLookupTablet(t){
  document.getElementById('lookupResult').innerHTML=`
    <div class="scan-profile" style="border-color:var(--accent)">
      <div class="sp-head">
        ${t.photo?`<div class="sp-av" style="border-radius:12px;background:var(--al)"><img src="${t.photo}"></div>`:'<div class="sp-av" style="background:var(--al);color:var(--accent)">📱</div>'}
        <div>
          <div class="sp-name">${t.id}</div>
          <div class="sp-role">${t.assignee?'● '+t.assignee.name+' වෙත ලබාදී ඇත':'● ලබා ගත හැකිය'}</div>
        </div>
      </div>
      <table class="sp-tbl">
        <tr><td>Tab No</td><td style="font-family:JetBrains Mono,monospace;font-weight:700">${t.id}</td></tr>
        <tr><td>Tab Serial</td><td style="font-family:JetBrains Mono,monospace;font-size:11px">${t.ts}</td></tr>
        <tr><td>KB Serial</td><td style="font-family:JetBrains Mono,monospace;font-size:11px">${t.ks}</td></tr>
        ${t.assignee?`<tr><td>ලබාදී ඇත්තේ</td><td>${t.assignee.name}</td></tr>
        <tr><td>ලබාදුන් දිනය</td><td>${t.assignee.date}</td></tr>`:''}
        ${t.notes?`<tr><td>සටහන</td><td>${t.notes}</td></tr>`:''}
      </table>
    </div>`;
}

// ════ QR SCAN — ISSUE MODE ════
function startScan(step){
  const btn=document.getElementById('scanBtn'+step);
  const wrap=document.getElementById('cam'+step);
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    showToast('❌ HTTPS අවශ්‍යයි — Camera API නොමැත','err'); return;
  }
  btn.disabled=true; btn.textContent='⏳ Camera ලබාගනිමින්...';
  const tryCamera=constraints=>navigator.mediaDevices.getUserMedia(constraints).then(stream=>{
    if(step===1){scanStream1=stream;}else{scanStream2=stream;}
    const vid=document.getElementById('vid'+step);
    vid.srcObject=stream; vid.play();
    wrap.style.display='block'; btn.style.display='none';
    btn.disabled=false; btn.textContent='📷 Camera විවෘත කරන්න';
    if(step===1) scanFrame1(); else scanFrame2();
  });
  tryCamera({video:{facingMode:{ideal:'environment'}}})
    .catch(()=>tryCamera({video:true}))
    .catch(err=>{
      btn.disabled=false; btn.textContent='📷 Camera විවෘත කරන්න';
      wrap.style.display='none';
      const msg=err.name==='NotAllowedError'?'Camera අවසරය ප්‍රතික්ෂේප විය':
                err.name==='NotFoundError'?'Camera හමු නොවිණි':
                err.name==='NotReadableError'?'Camera වෙනත් app එකක් භාවිත කරයි':
                'Camera error: '+err.name;
      showToast('❌ '+msg,'err');
    });
}
function stopCam(step){
  if(step===1&&scanStream1){scanStream1.getTracks().forEach(t=>t.stop());scanStream1=null;cancelAnimationFrame(scanAF1);}
  if(step===2&&scanStream2){scanStream2.getTracks().forEach(t=>t.stop());scanStream2=null;cancelAnimationFrame(scanAF2);}
  document.getElementById('cam'+step).style.display='none';
}
function scanFrame1(){
  const vid=document.getElementById('vid1'),cvs=document.getElementById('cvs1');
  if(!scanStream1||vid.readyState<2){scanAF1=requestAnimationFrame(scanFrame1);return;}
  cvs.width=vid.videoWidth;cvs.height=vid.videoHeight;
  const ctx=cvs.getContext('2d');ctx.drawImage(vid,0,0);
  const img=ctx.getImageData(0,0,cvs.width,cvs.height);
  const code=jsQR(img.data,img.width,img.height);
  if(code){stopCam(1);handleTab1QR(code.data);return;}
  scanAF1=requestAnimationFrame(scanFrame1);
}
function scanFrame2(){
  const vid=document.getElementById('vid2'),cvs=document.getElementById('cvs2');
  if(!scanStream2||vid.readyState<2){scanAF2=requestAnimationFrame(scanFrame2);return;}
  cvs.width=vid.videoWidth;cvs.height=vid.videoHeight;
  const ctx=cvs.getContext('2d');ctx.drawImage(vid,0,0);
  const img=ctx.getImageData(0,0,cvs.width,cvs.height);
  const code=jsQR(img.data,img.width,img.height);
  if(code){stopCam(2);handlePerson2QR(code.data);return;}
  scanAF2=requestAnimationFrame(scanFrame2);
}
function handleTab1QR(raw){
  let d;try{d=JSON.parse(raw);}catch{showSR(1,'err','❌','QR format වලංගු නොවේ');return;}
  const t=tablets.find(x=>x.id===d.id||x.id===d.tabNo||x.ts===d.serial||x.ts===d.tabSerial||x.ks===d.kbSerial||x.ks===d.serial);
  if(!t){showSR(1,'err','❌','ටැබ්ලට් හමු නොවිණි');return;}
  if(t.assignee){showSR(1,'err','⚠️',t.id+' — දැනටමත් '+t.assignee.name+' ලබාදී ඇත');return;}
  scannedTab={id:t.id,ts:t.ts,ks:t.ks,tabObj:t};
  showSR(1,'ok','✅',t.id+' — '+t.ts);
  document.getElementById('rescan1').style.display='block';
  document.getElementById('sn1').className='step-num done';
  const s2=document.getElementById('step2');
  s2.style.opacity='1'; s2.style.pointerEvents='auto';
  document.getElementById('sn2').className='step-num active';
  document.getElementById('scanBtn2').style.display='block';
  document.getElementById('manualBtn').style.display='block';
}
function handlePerson2QR(raw){
  let d;try{d=JSON.parse(raw);}catch{showSR(2,'err','❌','QR format වලංගු නොවේ');return;}
  if(d.type==='student'){
    const s=students.find(x=>x.id===d.id)||students.find(x=>x.name===d.name);
    if(s){scannedPerson={type:'student',name:s.name,grade:'Grade '+s.grade+' '+s.cls,photo:s.photo||null,phone:'',nic:''};}
    else scannedPerson={type:'student',name:d.name,grade:d.grade+' '+d.cls,photo:null,phone:'',nic:''};
  } else if(d.type==='teacher'){
    const t=teachers.find(x=>x.id===d.id)||teachers.find(x=>x.name===d.name);
    if(t){scannedPerson={type:'teacher',name:t.name,grade:'',phone:t.phone,nic:t.nic||'',photo:t.photo||null};}
    else scannedPerson={type:'teacher',name:d.name,grade:'',phone:d.phone,nic:d.nic||'',photo:null};
  } else {showSR(2,'err','❌','ඉදිරිපත් කළ QR සිසු/ගුරු QR නොවේ');return;}
  showSR(2,'ok','✅',scannedPerson.name);
  showPersonPreview(scannedPerson);
  activateStep3();
}
function showSR(step,cls,icon,msg){
  const el=document.getElementById('sr'+step);
  el.className='sr '+cls; el.style.display='block';
  el.querySelector('.sr-icon').textContent=icon;
  el.querySelector('.sr-id').textContent=msg;
}
function showPersonPreview(p){
  const el=document.getElementById('pp2'); el.style.display='block';
  const av=document.getElementById('ppav');
  if(p.photo){av.innerHTML=`<img src="${p.photo}">`;av.style.background='transparent';}
  else{av.textContent=p.name.charAt(0).toUpperCase();av.style.background=p.type==='teacher'?'var(--pink)':'var(--accent)';}
  document.getElementById('ppname').textContent=p.name;
  document.getElementById('pprole').textContent=p.type==='teacher'?'👩‍🏫 ගුරු':'👦 සිසු';
}
function activateStep3(){
  document.getElementById('sn2').className='step-num done';
  document.getElementById('rescan2').style.display='block';
  const s3=document.getElementById('step3');s3.style.opacity='1';s3.style.pointerEvents='auto';
  document.getElementById('sn3').className='step-num active';
  const cb=document.getElementById('confirmBox'),cd=document.getElementById('confDetail');
  const t=scannedTab,p=scannedPerson;
  cd.innerHTML=`<div style="font-size:15px;font-weight:700">${t.id} → ${p.name}</div>
    <div style="font-size:11px;color:var(--muted);margin-top:4px">${p.type==='teacher'?'👩‍🏫 ගුරු':'👦 සිසු'} | ${p.grade||p.phone}</div>`;
  cb.style.display='block';
  document.getElementById('confirmBtn').style.display='block';
}
function confirmIssue(){
  if(!scannedTab||!scannedPerson){showToast('Scan කරන්න','err');return;}
  const t=tablets.find(x=>x.id===scannedTab.id);
  if(!t) return;
  t.assignee={type:scannedPerson.type,name:scannedPerson.name,grade:scannedPerson.grade,phone:scannedPerson.phone,nic:scannedPerson.nic,photo:scannedPerson.photo,date:new Date().toLocaleDateString('si-LK')};
  persist(); showToast('✅ '+scannedTab.id+' → '+scannedPerson.name,'ok'); resetScan();
}
function showManual(){document.getElementById('manualForm').style.display='block';document.getElementById('manualBtn').style.display='none';}
function swMT(type){
  manualType=type;
  document.getElementById('mstu').style.display=type==='student'?'block':'none';
  document.getElementById('mtch').style.display=type==='teacher'?'block':'none';
  document.getElementById('mt-s').className='tsw-btn'+(type==='student'?' on':'');
  document.getElementById('mt-t').className='tsw-btn'+(type==='teacher'?' on':'');
}
function resetScan(){
  stopCam(1);stopCam(2);
  scannedTab=null;scannedPerson=null;useManual=false;
  ['sr1','sr2','pp2'].forEach(id=>{document.getElementById(id).style.display='none';});
  ['scanBtn1','scanBtn2','manualBtn'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=id==='scanBtn1'?'block':'none';});
  ['rescan1','rescan2','confirmBtn'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  document.getElementById('confirmBox').style.display='none';
  document.getElementById('manualForm').style.display='none';
  document.getElementById('sn1').className='step-num active';
  document.getElementById('sn2').className='step-num';
  document.getElementById('sn3').className='step-num';
  document.getElementById('step2').style.cssText='opacity:.45;pointer-events:none';
  document.getElementById('step3').style.cssText='opacity:.45;pointer-events:none';
}
function resetScan2(){
  stopCam(2);scannedPerson=null;
  document.getElementById('sr2').style.display='none';
  document.getElementById('pp2').style.display='none';
  document.getElementById('rescan2').style.display='none';
  document.getElementById('confirmBtn').style.display='none';
  document.getElementById('confirmBox').style.display='none';
  document.getElementById('scanBtn2').style.display='block';
  document.getElementById('manualBtn').style.display='block';
  document.getElementById('sn2').className='step-num active';
  document.getElementById('sn3').className='step-num';
  document.getElementById('step3').style.cssText='opacity:.45;pointer-events:none';
}

// ════ RETURN ════
function doReturn(){
  const id=document.getElementById('r-sel').value;
  if(!id){showToast('ටැබ්ලට් තෝරන්න','err');return;} quickReturn(id);
}
function quickReturn(id){
  const t=tablets.find(x=>x.id===id);if(!t||!t.assignee) return;
  const nm=t.assignee.name; t.assignee=null;
  closeOvDirect(); persist(); showToast('↩️ '+id+' — '+nm+' ආපසු ලැබිණ','ok');
}

// ════ SELECTS ════
function refillSels(){
  const asgn=tablets.filter(t=>t.assignee);
  document.getElementById('r-sel').innerHTML='<option value="">-- ලබාදුන් ටැබ්ලට් --</option>'+
    asgn.map(t=>`<option value="${t.id}">${t.id} — ${t.assignee?.name}</option>`).join('');
  document.getElementById('qr-sel').innerHTML='<option value="">-- ටැබ්ලට් --</option>'+
    tablets.map(t=>`<option value="${t.id}">${t.id} — ${t.ts}</option>`).join('');
}

// ════ PHOTO ════
function loadPh(inp,prevId,key){
  const f=inp.files[0];if(!f) return;
  const r=new FileReader();
  r.onload=e=>{const img=new Image();img.onload=()=>{
    const k=Math.min(1,480/Math.max(img.width,img.height)),c=document.createElement('canvas');
    c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    const u=c.toDataURL('image/jpeg',.7);ph[key]=u;const p=document.getElementById(prevId);p.src=u;p.style.display='block';};img.src=e.target.result;};
  r.readAsDataURL(f);
}

// ════ MODAL ════
function closeOv(e){if(e.target===document.getElementById('ov'))closeOvDirect();}
function closeOvDirect(){document.getElementById('ov').classList.remove('open');}

// ════ NAV ════
function goPage(name,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById('pg-'+name).classList.add('active');
  btn.classList.add('on');
  if(name==='more') refillSels();
  if(name==='scan') {resetScan();resetLookupScan();}
  if(name==='stu'){renderStuList();document.getElementById('s-id').value=autoStuId();}
  if(name==='tch'){renderTchList();document.getElementById('t-id').value=autoTchId();}
  window.scrollTo(0,0);
}

// ════ EXPORT/IMPORT ════
function exportJSON(){
  const all={version:4,exportDate:new Date().toISOString(),tablets,students,teachers};
  const b=new Blob([JSON.stringify(all,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(b);
  a.download='denzil_db_'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); markExport();
}
function importJSON(inp){
  const f=inp.files[0];if(!f) return;
  const r=new FileReader();
  r.onload=e=>{
    try{const d=JSON.parse(e.target.result);
      if(d.tablets||d.students||d.teachers){
        if(d.tablets) tablets=d.tablets;
        if(d.students) students=d.students;
        if(d.teachers) teachers=d.teachers;
        persist();
        showToast('📥 ටැබ් '+tablets.length+' | සිසු '+students.length+' | ගුරු '+teachers.length+' ආයාත','ok');
      } else if(Array.isArray(d)){tablets=d;persist();showToast('📥 ටැබ් '+d.length+' ක් ආයාත','ok');}
      else showToast('ගොනුව වලංගු නොවේ','err');
    }catch{showToast('කියවිය නොහැකිය','err');}
  };
  r.readAsText(f); inp.value='';
}
function clearAll(){
  if(prompt('සියලු දත්ත Cloud එකෙන්ද මැකේ! තහවුරු කිරීමට DELETE ලියන්න')!=='DELETE') return;
  tablets=[];students=[];teachers=[]; persist(); showToast('🗑️ සියලු දත්ත ඉවත් විය');
}

// ════ TOAST ════
function showToast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show'+(type?' '+type:'');
  clearTimeout(t._t); t._t=setTimeout(()=>t.className='toast',2800);
}

// ════ JPEG DOWNLOAD ════
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}
function makeQRJpeg(qrData,label,sub,cb){
  const size=280,pad=18,titleH=26,subH=18,schoolH=16;
  const totalH=pad+titleH+8+size+6+subH+4+schoolH+pad,totalW=size+pad*2;
  const cvs=document.createElement('canvas');cvs.width=totalW;cvs.height=totalH;
  const ctx=cvs.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,totalW,totalH);
  ctx.strokeStyle='#c8d4f0';ctx.lineWidth=2;roundRect(ctx,3,3,totalW-6,totalH-6,10);ctx.stroke();
  ctx.fillStyle='#1a56db';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
  ctx.fillText(label,totalW/2,pad+16);
  const tmp=document.createElement('div');tmp.style.cssText='position:fixed;left:-9999px;top:0';
  document.body.appendChild(tmp);
  new QRCode(tmp,{text:qrData,width:size,height:size,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
  setTimeout(()=>{
    const qrEl=tmp.querySelector('img')||tmp.querySelector('canvas');
    const draw=()=>{
      const y=pad+titleH+8;
      if(qrEl.tagName==='IMG'){const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{ctx.drawImage(img,pad,y,size,size);fin();};img.src=qrEl.src;}
      else{ctx.drawImage(qrEl,pad,y,size,size);fin();}
    };
    const fin=()=>{
      document.body.removeChild(tmp);
      let ty=pad+titleH+8+size+6;
      ctx.fillStyle='#475569';ctx.font='11px monospace';ctx.textAlign='center';
      ctx.fillText(sub||'',totalW/2,ty+12);ty+=subH+4;
      ctx.fillStyle='#94a3b8';ctx.font='9px sans-serif';
      ctx.fillText('Denzil Kobbekaduwa · ICT',totalW/2,ty+10);
      cb(cvs.toDataURL('image/jpeg',0.92));
    };
    if(qrEl.tagName==='IMG'&&!qrEl.complete){qrEl.onload=draw;}else{draw();}
  },350);
}
function downloadQRJpeg(qrData,label,sub,filename){
  makeQRJpeg(qrData,label,sub,dataUrl=>{
    const a=document.createElement('a');
    a.download=(filename||label).replace(/[^\w\-]/g,'_')+'.jpg';
    a.href=dataUrl;a.click();
    showToast('📥 JPEG download විය','ok');
  });
}
function downloadBatchJpeg(items,prefix){
  if(!items.length){showToast('දත්ත නොමැත','err');return;}
  showToast('⏳ JPEG සූදානම් වෙමින්...','');
  let i=0;
  const next=()=>{
    if(i>=items.length)return;
    const it=items[i];
    makeQRJpeg(it.data,it.label,it.sub,dataUrl=>{
      const a=document.createElement('a');
      a.download=prefix+'_'+String(i+1).padStart(3,'0')+'.jpg';
      a.href=dataUrl;a.click();
      i++;setTimeout(next,500);
    });
  };
  setTimeout(next,200);
}
function downloadTabQRJpeg(id){
  const t=tablets.find(x=>x.id===id);if(!t)return;
  downloadQRJpeg(JSON.stringify({type:'tablet',id:t.id,tabNo:t.id,tabSerial:t.ts,kbSerial:t.ks}),'📱 '+t.id,'Tab:'+t.ts+' KB:'+t.ks,t.id);
}
function downloadTabQRJpegSel(){
  const id=document.getElementById('qr-sel').value;
  if(!id){showToast('ටැබ්ලට් තෝරන්න','err');return;}
  downloadTabQRJpeg(id);
}
function downloadAllTabQRJpeg(){
  if(!tablets.length){showToast('ටැබ්ලට් නොමැත','err');return;}
  downloadBatchJpeg(tablets.map(t=>({label:'📱 '+t.id,sub:'Tab:'+t.ts,data:JSON.stringify({type:'tablet',id:t.id,tabNo:t.id,tabSerial:t.ts,kbSerial:t.ks})})),'TAB');
}
function downloadPersonQRJpeg(type,id){
  let p=type==='student'?students.find(s=>s.id===id):teachers.find(t=>t.id===id);if(!p)return;
  const data=type==='student'
    ?JSON.stringify({type:'student',id:p.id,name:p.name,grade:p.grade,cls:p.cls,stream:p.stream||''})
    :JSON.stringify({type:'teacher',id:p.id,name:p.name,phone:p.phone,nic:p.nic||'',subject:p.subject||''});
  downloadQRJpeg(data,(type==='student'?'👦 ':'👩‍🏫 ')+p.name,p.id,p.id);
}
function downloadStuQRBatchJpeg(){
  const grade=document.getElementById('stuQrGrade').value;
  const list=grade?students.filter(s=>'Grade '+s.grade+' '+s.cls===grade):students;
  if(!list.length){showToast('සිසුන් නොමැත','err');return;}
  downloadBatchJpeg(list.map(s=>({label:'👦 '+s.name,sub:s.id+' Grade '+s.grade+s.cls,data:JSON.stringify({type:'student',id:s.id,name:s.name,grade:s.grade,cls:s.cls,stream:s.stream||''})})),'STU');
}
function downloadTchQRBatchJpeg(){
  if(!teachers.length){showToast('ගුරුවරු නොමැත','err');return;}
  downloadBatchJpeg(teachers.map(t=>({label:'👩‍🏫 '+t.name,sub:t.id+' '+t.phone,data:JSON.stringify({type:'teacher',id:t.id,name:t.name,phone:t.phone,nic:t.nic||'',subject:t.subject||''})})),'TCH');
}

// ════ PDF REPORTS ════
function pdfReport(type){
  if(typeof window.jspdf==='undefined'){showToast('PDF library load වෙමින්... නැවත උත්සාහ කරන්න','err');return;}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const school='B/Denzil Kobbekaduwa Maha Vidyalaya, Hali Ela · ICT Unit';
  const now=new Date().toLocaleDateString('en-GB');
  const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();
  const hdr=(title,sub)=>{
    doc.setFillColor(26,86,219);doc.rect(0,0,W,28,'F');
    doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text(title,14,12);
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.text(school,14,19);
    if(sub)doc.text(sub,14,24);doc.text('Generated: '+now,W-14,24,{align:'right'});
    doc.setTextColor(0,0,0);
  };
  const ftr=(n,tot)=>{
    doc.setFillColor(240,244,255);doc.rect(0,H-10,W,10,'F');
    doc.setTextColor(100,116,139);doc.setFontSize(7);doc.setFont('helvetica','normal');
    doc.text(school,14,H-3.5);doc.text('Page '+n+' / '+tot,W-14,H-3.5,{align:'right'});
    doc.setTextColor(0,0,0);
  };
  const sbox=(x,y,w,h,lbl,val,col)=>{
    doc.setFillColor(...col);doc.roundedRect(x,y,w,h,2,2,'F');
    doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(18);
    doc.text(String(val),x+w/2,y+h*0.58,{align:'center'});
    doc.setFontSize(7);doc.setFont('helvetica','normal');doc.text(lbl,x+w/2,y+h*0.85,{align:'center'});
    doc.setTextColor(0,0,0);
  };
  const finalize=()=>{
    const tot=doc.internal.getNumberOfPages();
    for(let i=1;i<=tot;i++){doc.setPage(i);ftr(i,tot);}
  };
  const HS={fillColor:[26,86,219],textColor:255,fontStyle:'bold'};
  const AS={fillColor:[240,244,255]};

  if(type==='inventory'){
    hdr('Tablet Inventory Report','Complete register with assignment status');
    const tot=tablets.length,av=tablets.filter(t=>!t.assignee).length,us=tablets.filter(t=>t.assignee).length;
    sbox(14,32,52,18,'Total',tot,[26,86,219]);sbox(70,32,52,18,'Available',av,[10,124,66]);sbox(126,32,52,18,'Issued',us,[229,0,122]);
    doc.autoTable({startY:55,head:[['Tab No','Tab Serial','KB Serial','Status','Assigned To','Date']],
      body:tablets.map(t=>[t.id,t.ts,t.ks,t.assignee?'Issued':'Available',t.assignee?t.assignee.name:'—',t.assignee?t.assignee.date:'—']),
      styles:{fontSize:7.5,cellPadding:2.5},headStyles:HS,alternateRowStyles:AS,
      columnStyles:{0:{fontStyle:'bold',textColor:[26,86,219],cellWidth:22},1:{cellWidth:36,fontSize:6.5},2:{cellWidth:36,fontSize:6.5},3:{cellWidth:20,halign:'center'},4:{cellWidth:36},5:{cellWidth:22}},
      didParseCell(d){if(d.section==='body'&&d.column.index===3){d.cell.styles.textColor=d.cell.raw==='Issued'?[229,0,122]:[10,124,66];d.cell.styles.fontStyle='bold';}},
      margin:{left:14,right:14}});
    finalize();doc.save('Tablet_Inventory_'+now.replace(/\//g,'-')+'.pdf');showToast('📄 Inventory PDF download විය','ok');

  }else if(type==='assigned'){
    const assigned=tablets.filter(t=>t.assignee);
    hdr('Issued Tablets Report','Currently issued tablets');
    sbox(14,32,52,18,'Total Issued',assigned.length,[26,86,219]);
    sbox(70,32,52,18,'To Students',assigned.filter(t=>t.assignee.type==='student').length,[10,124,66]);
    sbox(126,32,52,18,'To Teachers',assigned.filter(t=>t.assignee.type==='teacher').length,[229,0,122]);
    doc.autoTable({startY:55,head:[['Tab No','Tab Serial','Type','Name','Grade / Phone','Date']],
      body:assigned.map(t=>[t.id,t.ts,t.assignee.type==='student'?'Student':'Teacher',t.assignee.name,t.assignee.grade||t.assignee.phone||'—',t.assignee.date]),
      styles:{fontSize:7.5,cellPadding:2.5},headStyles:HS,alternateRowStyles:AS,
      columnStyles:{0:{fontStyle:'bold',textColor:[26,86,219],cellWidth:22},1:{cellWidth:36,fontSize:6.5},2:{cellWidth:20,halign:'center'},3:{cellWidth:40},4:{cellWidth:30},5:{cellWidth:26}},
      didParseCell(d){if(d.section==='body'&&d.column.index===2){d.cell.styles.textColor=d.cell.raw==='Teacher'?[229,0,122]:[26,86,219];d.cell.styles.fontStyle='bold';}},
      margin:{left:14,right:14}});
    finalize();doc.save('Issued_Tablets_'+now.replace(/\//g,'-')+'.pdf');showToast('📄 Issued PDF download විය','ok');

  }else if(type==='students'){
    hdr('Student Register','All students grouped by class');
    sbox(14,32,52,18,'Students',students.length,[26,86,219]);
    sbox(70,32,52,18,'Grades',[...new Set(students.map(s=>s.grade))].length,[10,124,66]);
    sbox(126,32,52,18,'With Tablet',students.filter(s=>tablets.some(t=>t.assignee?.name===s.name)).length,[229,0,122]);
    const groups={};students.forEach(s=>{const k='Grade '+s.grade+' '+s.cls;if(!groups[k])groups[k]=[];groups[k].push(s);});
    let y=55;
    Object.keys(groups).sort().forEach(grp=>{
      doc.autoTable({startY:y,
        head:[[{content:grp+' ('+groups[grp].length+')',colSpan:5,styles:{fillColor:[200,212,240],textColor:[26,86,219],fontStyle:'bold',fontSize:9}}],['ID','Name','Stream','DOB','Tablet']],
        body:groups[grp].map(s=>{const tab=tablets.find(t=>t.assignee?.name===s.name);return[s.id,s.name,s.stream||'—',s.dob||'—',tab?tab.id:'—'];}),
        styles:{fontSize:7.5,cellPadding:2.2},headStyles:HS,alternateRowStyles:AS,
        columnStyles:{0:{cellWidth:22,fontStyle:'bold',textColor:[26,86,219]},1:{cellWidth:55},2:{cellWidth:25},3:{cellWidth:28},4:{cellWidth:22,halign:'center'}},
        margin:{left:14,right:14}});
      y=doc.lastAutoTable.finalY+5;
    });
    finalize();doc.save('Student_Register_'+now.replace(/\//g,'-')+'.pdf');showToast('📄 Student PDF download විය','ok');

  }else if(type==='teachers'){
    hdr('Teacher Register','All registered teachers');
    sbox(14,32,52,18,'Teachers',teachers.length,[26,86,219]);
    sbox(70,32,52,18,'With Tablet',teachers.filter(t=>tablets.some(tb=>tb.assignee?.name===t.name)).length,[10,124,66]);
    doc.autoTable({startY:55,head:[['ID','Name','Phone','NIC','Subject','Tablet']],
      body:teachers.map(t=>{const tab=tablets.find(tb=>tb.assignee?.name===t.name);return[t.id,t.name,t.phone,t.nic||'—',t.subject||'—',tab?tab.id:'—'];}),
      styles:{fontSize:7.5,cellPadding:2.5},headStyles:HS,alternateRowStyles:AS,
      columnStyles:{0:{cellWidth:22,fontStyle:'bold',textColor:[229,0,122]},1:{cellWidth:50},2:{cellWidth:28},3:{cellWidth:28},4:{cellWidth:28},5:{cellWidth:22,halign:'center'}},
      margin:{left:14,right:14}});
    finalize();doc.save('Teacher_Register_'+now.replace(/\//g,'-')+'.pdf');showToast('📄 Teacher PDF download විය','ok');

  }else if(type==='summary'){
    hdr('Summary Report','Overall system overview');
    const tot=tablets.length,av=tablets.filter(t=>!t.assignee).length,us=tablets.filter(t=>t.assignee).length;
    sbox(14,32,40,20,'Tablets',tot,[26,86,219]);sbox(57,32,40,20,'Available',av,[10,124,66]);
    sbox(100,32,40,20,'Issued',us,[229,0,122]);sbox(143,32,40,20,'Students',students.length,[26,86,219]);
    sbox(14,56,40,20,'Teachers',teachers.length,[229,0,122]);
    sbox(57,56,40,20,'Stu Issued',tablets.filter(t=>t.assignee?.type==='student').length,[10,124,66]);
    sbox(100,56,40,20,'Tch Issued',tablets.filter(t=>t.assignee?.type==='teacher').length,[229,0,122]);
    doc.autoTable({startY:82,head:[['Tab No','Status','Assigned To','Type','Date']],
      body:tablets.map(t=>[t.id,t.assignee?'Issued':'Available',t.assignee?t.assignee.name:'—',t.assignee?t.assignee.type:'—',t.assignee?t.assignee.date:'—']),
      styles:{fontSize:7,cellPadding:2},headStyles:HS,alternateRowStyles:AS,
      didParseCell(d){if(d.section==='body'&&d.column.index===1){d.cell.styles.textColor=d.cell.raw==='Issued'?[229,0,122]:[10,124,66];d.cell.styles.fontStyle='bold';}},
      margin:{left:14,right:14}});
    const gradeMap={};students.forEach(s=>{const k='Grade '+s.grade+' '+s.cls;gradeMap[k]=(gradeMap[k]||0)+1;});
    doc.autoTable({startY:doc.lastAutoTable.finalY+6,
      head:[[{content:'Student Class Breakdown',colSpan:3,styles:{fillColor:[10,124,66],textColor:255,fontStyle:'bold'}}],['Class','Students','With Tablet']],
      body:Object.keys(gradeMap).sort().map(k=>[k,gradeMap[k],students.filter(s=>('Grade '+s.grade+' '+s.cls)===k&&tablets.some(t=>t.assignee?.name===s.name)).length]),
      styles:{fontSize:7.5,cellPadding:2},headStyles:{fillColor:[10,124,66],textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[212,245,230]},
      columnStyles:{0:{cellWidth:60},1:{cellWidth:30,halign:'center'},2:{cellWidth:30,halign:'center'}},
      margin:{left:14,right:14}});
    finalize();doc.save('Summary_Report_'+now.replace(/\//g,'-')+'.pdf');showToast('📄 Summary PDF download විය','ok');
  }
}


// ════ GOOGLE SHEETS SYNC ════
// ════ FIREBASE ════
const COND={'WORKING':'වැඩ කරයි','NOT WORKING':'වැඩ නොකරයි','NOT CHARGING':'Charge නොවේ'};
function condTxt(t){const bad=(t.condition&&t.condition!=='WORKING')||t.issue;return bad?' · ⚠️ '+(COND[t.condition]||'')+(t.issue?' '+t.issue:''):'';}
const SEED_TABLETS=[{"id": "ST01", "ts": "YX002LML", "ks": "8S5D20R4938401HF9C103A3", "condition": "NOT WORKING", "issue": "", "notes": ""}, {"id": "ST02", "ts": "YX002204", "ks": "8S5D20R4938401HF9V700PK", "condition": "WORKING", "issue": "KEYBOARD ISSUE 7 PRESSING", "notes": ""}, {"id": "ST03", "ts": "YX002KA7", "ks": "8S5D20R4938401HF9C1017R", "condition": "NOT WORKING", "issue": "", "notes": ""}, {"id": "ST04", "ts": "YX000D0E", "ks": "8S5D20R4938401HF9BB024U", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST05", "ts": "YX000Q77", "ks": "8S5D20R4938401HF9DF03ME", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST06", "ts": "YX000L33", "ks": "8S5D20R4938401HF9C100XJ", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST07", "ts": "YX002J6V", "ks": "8S5D20R4938401HF9C103WX", "condition": "WORKING", "issue": "", "notes": "Serial අංක ST22 සමග සමානයි — පරීක්ෂා කරන්න"}, {"id": "ST08", "ts": "YX000Q6W", "ks": "8S5D20R4938401HF9BF046C", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST09", "ts": "YX002KQT", "ks": "8S5D20R4938401HF9B70122", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST10", "ts": "YX002EC4", "ks": "8S5D20R4938401HF9C1009D", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST11", "ts": "YX001PLD", "ks": "8S5D20R4938401HF9BR00H6", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST12", "ts": "YX002K7B", "ks": "8S5D20R4938401HF9C101PL", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST13", "ts": "YX002K3B", "ks": "8S5D20R4938401HF9C10170", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST14", "ts": "YX002K1K", "ks": "8S5D20R4938401HF9C1019M", "condition": "NOT WORKING", "issue": "", "notes": ""}, {"id": "ST15", "ts": "YX002E4X", "ks": "8S5D20R4938401HF9BU009P", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST16", "ts": "YX002K8P", "ks": "8S5D20R4938401HF9C100HJ", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST17", "ts": "YX002LOQ", "ks": "8S5D20R4938401HF9BD0141", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST18", "ts": "YX001B6A", "ks": "8S5D20R4938401HF9BR02HV", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST19", "ts": "YX002DTP", "ks": "8S5D20R4938401HF9DN00QJ", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST20", "ts": "YX002L8L", "ks": "8S5D20R4938401HF9BU027K", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST21", "ts": "YX0026EP", "ks": "8S5D20R4938401HF9C101NN", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST22", "ts": "YX002J6V", "ks": "8S5D20R4938401HF9C103WX", "condition": "WORKING", "issue": "", "notes": "Serial අංක ST07 සමග සමානයි — පරීක්ෂා කරන්න"}, {"id": "ST23", "ts": "YX002K9D", "ks": "8S5D20R4938401HF9BU01DE", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST24", "ts": "YX002K50", "ks": "8S5D20R4938401HF9C100V5", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST25", "ts": "YX002KAE", "ks": "8S5D20R4938401HF9C101Z2", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST26", "ts": "YX002K4V", "ks": "8S5D20R4938401HF9C100GW", "condition": "NOT WORKING", "issue": "", "notes": ""}, {"id": "ST27", "ts": "YX002JYE", "ks": "8S5D20R4938401HF9C102EM", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST28", "ts": "YX002KBA", "ks": "8S5B20R4938401HF9C100U2", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST29", "ts": "YX002K0Q", "ks": "8S5B20R4938401HF9BU01XU", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST30", "ts": "YX002JYK", "ks": "8S5B20R4938401HF9C10255", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST31", "ts": "YX002LMQ", "ks": "8S5D20R4938401HF9C1033J", "condition": "NOT WORKING", "issue": "", "notes": ""}, {"id": "ST32", "ts": "YX001Y1A", "ks": "8S5B20R4938401HF9BU00K9", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST33", "ts": "YX0026RQ", "ks": "8S5B20R4938401HF9BD0191", "condition": "WORKING", "issue": "Space key pressing", "notes": ""}, {"id": "ST34", "ts": "YX002JR5", "ks": "8S5B20R4938401HF9C10413", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST35", "ts": "YX0025YK", "ks": "8S5D20R4938401HF9C102PV", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST36", "ts": "YX0012EA", "ks": "8S5D20R4938401HF9BE01TY", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST37", "ts": "YX001WLM", "ks": "8S5D20R4938401HF9BS00XH", "condition": "NOT CHARGING", "issue": "", "notes": ""}, {"id": "ST38", "ts": "YX002K3C", "ks": "8S5D20R4938401HF9C10JG", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST39", "ts": "YX0023Y8", "ks": "8S5D20R4938401HF9C103KQ", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST40", "ts": "YX0025P5", "ks": "8S5D20R4938401HF9C102MY", "condition": "NOT WORKING", "issue": "", "notes": ""}, {"id": "ST41", "ts": "YX002643", "ks": "8S5D20R4938401HF9BU00WM", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST42", "ts": "YX001P5B", "ks": "8S5D20R4938401HF9BN03AX", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "ST43", "ts": "YX002LDX", "ks": "8S5D20R4938401HF9B700EY", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "TH01", "ts": "YX0004YG", "ks": "8S5D20R4938401HF9B700CX", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "TH02", "ts": "YX000687", "ks": "8S5D20R4938401HF9BU0102", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "TH03", "ts": "YX00080N", "ks": "8S5D20R4938401HF9B701DD", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "TH04", "ts": "YX0007RV", "ks": "8S5D20R4938401HF9C100KY", "condition": "WORKING", "issue": "Password problem", "notes": ""}, {"id": "TH05", "ts": "YX0007DV", "ks": "8S5D20R4938401HF9C102T9", "condition": "WORKING", "issue": "", "notes": ""}, {"id": "TH06", "ts": "YX001CYF", "ks": "8S5D20R4938401HF9C902NW", "condition": "WORKING", "issue": "Password problem", "notes": ""}];
const COLS=['tablets','students','teachers'];
let db,auth,unsubs=[];const ready={},saved={tablets:new Map(),students:new Map(),teachers:new Map()};
const getA=c=>c==='tablets'?tablets:c==='students'?students:teachers;
const setA=(c,a)=>{if(c==='tablets')tablets=a;else if(c==='students')students=a;else teachers=a;};
const clean=o=>JSON.parse(JSON.stringify(o));
const stable=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((r,x)=>(r[x]=v[x],r),{}):v);
const did=id=>String(id).replace(/\//g,'_');
function setSync(s){const c=document.getElementById('syncChip');c.className='sync-chip '+s;c.textContent={live:'🟢 Live',offline:'🟠 Offline',pending:'🔄 Saving',error:'🔴 Error'}[s];}
function pushChanges(){
  if(!db) return; const ops=[];
  COLS.forEach(c=>{ if(!ready[c]) return; const cur=new Set();
    getA(c).forEach(o=>{const d=clean(o),id=did(o.id);cur.add(id);const k=stable(d);
      if(saved[c].get(id)!==k){ if(JSON.stringify(d).length>900000){d.photo=null;d.kbPhoto=null;showToast('ඡායාරූපය විශාල වැඩියි — ඉවත් කළා','err');}
        ops.push([c,id,d]);saved[c].set(id,stable(d));}});
    [...saved[c].keys()].forEach(id=>{if(!cur.has(id)){ops.push([c,id,null]);saved[c].delete(id);}});
  });
  for(let i=0;i<ops.length;i+=400){const b=db.batch();
    ops.slice(i,i+400).forEach(([c,id,d])=>d?b.set(db.collection(c).doc(id),d):b.delete(db.collection(c).doc(id)));
    setSync('pending'); b.commit().then(()=>setSync(navigator.onLine?'live':'offline')).catch(e=>{setSync('error');showToast('Cloud save error: '+e.message,'err');});}
}
function startListeners(){
  COLS.forEach(c=>unsubs.push(db.collection(c).onSnapshot(snap=>{
    const list=[];saved[c].clear();
    snap.forEach(d=>{const o=d.data();o.id=o.id||d.id;list.push(o);saved[c].set(d.id,stable(o));});
    list.sort((a,b)=>String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
    setA(c,list);ready[c]=true;renderAll();setSync(!navigator.onLine?'offline':snap.metadata.hasPendingWrites?'pending':'live');
  },e=>{setSync('error');showToast('Cloud error: '+e.message,'err');})));
}
function seedTablets(){
  if(!confirm('ආරම්භක ටැබ්ලට් '+SEED_TABLETS.length+' ක් එකතු කරන්නද? (දැනටමත් ඇති ID මඟ හරිනු ඇත)')) return;
  const d=new Date().toLocaleDateString('si-LK');let n=0;
  SEED_TABLETS.forEach(s=>{if(!tablets.find(t=>t.id===s.id)){tablets.push({...s,photo:null,kbPhoto:null,dateAdded:d,assignee:null});n++;}});
  persist();showToast('🌱 ටැබ් '+n+' ක් එකතු විය','ok');
}
function doLogin(){
  const e=document.getElementById('lg-email').value.trim(),p=document.getElementById('lg-pass').value,er=document.getElementById('lg-err');
  if(!e||!p){er.textContent='Email සහ Password ඇතුළු කරන්න';return;} er.textContent='';
  auth.signInWithEmailAndPassword(e,p).catch(x=>{er.textContent=/invalid|wrong|user-not-found|credential/.test(x.code)?'Email හෝ Password වැරදියි':x.message;});
}
function doLogout(){auth.signOut();}
function initFirebase(){
  const er=document.getElementById('lg-err');
  if(typeof firebase==='undefined'||!firebaseConfig.apiKey||firebaseConfig.apiKey.startsWith('YOUR_')){er.textContent='firebase-config.js හි Firebase config ඇතුළු කරන්න (README බලන්න)';return;}
  firebase.initializeApp(firebaseConfig);auth=firebase.auth();db=firebase.firestore();
  db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  window.addEventListener('online',()=>setSync('live'));window.addEventListener('offline',()=>setSync('offline'));
  auth.onAuthStateChanged(u=>{
    unsubs.forEach(f=>f());unsubs=[];CRESET();
    if(u){document.body.classList.remove('locked');document.getElementById('acctInfo').textContent='Login: '+u.email;startListeners();}
    else{document.body.classList.add('locked');}
  });
}
function CRESET(){tablets=[];students=[];teachers=[];COLS.forEach(c=>{ready[c]=false;saved[c].clear();});renderAll();}
// ════ INIT ════
initFirebase();
