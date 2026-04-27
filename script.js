/* ===== Deciplan — BASMA script.js v2 ===== */

function initDark(){
  var t=localStorage.getItem('deciplan_theme')||'light';
  document.documentElement.setAttribute('data-theme',t);
  var b=document.getElementById('darkToggle');
  if(b) b.textContent=t==='dark'?'☀️':'🌙';
}
function toggleDark(){
  var cur=document.documentElement.getAttribute('data-theme');
  var next=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  localStorage.setItem('deciplan_theme',next);
  var b=document.getElementById('darkToggle');
  if(b) b.textContent=next==='dark'?'☀️':'🌙';
}

function initBac(){
  var today=new Date(); today.setHours(0,0,0,0);
  var bac=new Date(2026,5,4);
  var diff=Math.round((bac-today)/86400000);
  var el=document.getElementById('countdownBac');
  var banner=document.getElementById('bacBanner');
  if(!el) return;
  if(diff>0){
    el.textContent='Bac dans '+diff+' jours — 04 · 05 · 06 Juin 2026';
    if(diff<=30&&banner) banner.classList.add('urgent');
  } else if(diff===0){
    el.textContent='Le Bac commence aujourd\'hui — Bon courage !';
    if(banner) banner.classList.add('urgent');
  } else {
    el.textContent='Bac terminé — Bonne continuation !';
  }
}

function fmtNote(n){
  if(n===null||n===undefined||n==='') return '<span class="note-na">—</span>';
  var v=parseFloat(n); if(isNaN(v)) return '<span class="note-na">—</span>';
  var cls=v>=14?'note-good':v>=12?'note-avg':'note-low';
  return '<span class="'+cls+'">'+v.toFixed(2)+'</span>';
}
function fmtDate(s){
  if(!s||s.indexOf('—')>=0||s.indexOf('À')>=0||s.indexOf('confirm')>=0) return s||'—';
  if(s.match(/^\d{4}-\d{2}-\d{2}$/)){ var p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  return s;
}
function isEmpty(v){
  /* Version robuste — null, undefined, vide, ou tirets/marqueurs */
  if(v===null||v===undefined) return true;
  var s=String(v).trim();
  if(s==='') return true;
  /* Tiret standard et em-dash U+2014 */
  if(s==='-'||s.charCodeAt(0)===8212) return true;
  /* Marqueurs "à remplir" en minuscules */
  var low=s.toLowerCase();
  return low.indexOf('complet')>=0||low.indexOf('confirm')>=0||low.indexOf('remplir')>=0;
}

var ST={
  inscrit   :{label:'📝 Inscrit',          cls:'s-inscrit'},
  preselect :{label:'📋 Présélectionné',    cls:'s-preselect'},
  convoque  :{label:'📅 Convoqué',          cls:'s-convoque'},
  principale:{label:'🏆 Liste principale',  cls:'s-principal'},
  attente_1 :{label:'🟡 Att. 1',            cls:'s-att1'},
  attente_2 :{label:'🟠 Att. 2',            cls:'s-att2'},
  attente_3 :{label:'🔶 Att. 3',            cls:'s-att3'},
  confirme  :{label:'✅ Confirmé',          cls:'s-confirme'},
  refuse    :{label:'❌ Non retenu',         cls:'s-refuse'},
  en_cours  :{label:'⏳ En traitement',      cls:'s-cours'}
};

function badge(key){
  if(!key) return '<span class="cell-na">—</span>';
  var s=ST[key]; if(!s) return '<span class="cell-na">—</span>';
  return '<span class="statut-badge '+s.cls+'">'+s.label+'</span>';
}
function listeBadge(v){
  if(v===null||v===undefined) return '<span class="cell-na">—</span>';
  if(v===true)  return '<span class="liste-oui">✅ Oui</span>';
  if(v===false) return '<span class="liste-non">❌ Non</span>';
  return '<span class="cell-na">—</span>';
}

function renderProfil(e){
  var ph=document.getElementById('profile-photo');
  if(ph&&e.photo_b64) ph.src='data:image/jpeg;base64,'+e.photo_b64;
  var nomEl=document.getElementById('profile-nom');
  if(nomEl) nomEl.textContent=(!isEmpty(e.nom)?e.nom:'')||(e.prenom||'Étudiante');
  var filEl=document.getElementById('profile-filiere');
  if(filEl){
    var parts=[];
    if(!isEmpty(e.serie_bac)) parts.push(e.serie_bac);
    parts.push('Bac '+(e.annee_bac||2026));
    if(!isEmpty(e.academie))  parts.push(e.academie);
    filEl.textContent=parts.join(' · ');
  }
  var tagsEl=document.getElementById('profile-tags');
  if(tagsEl){
    var tags=[
      {k:'CIN',          v:e.cin},
      {k:'CNE',          v:e.cne},
      {k:'Né(e) le',     v:e.date_naissance},
      {k:'Ville',        v:e.ville},
      {k:'Email',        v:e.email||e.Email},
      {k:'Tél',          v:e.telephone}
    ];
    tagsEl.innerHTML=tags.filter(function(t){
      return t.v && !isEmpty(t.v);
    }).map(function(t){
      /* Email = lien cliquable */
      var val=t.k==='Email'
        ?'<a href="mailto:'+t.v+'" style="color:var(--acc)">'+t.v+'</a>'
        :t.v;
      return '<span class="id-tag"><strong>'+t.k+' :</strong> '+val+'</span>';
    }).join('');
  }
  var cc=document.getElementById('conseil-text');
  if(cc&&e.remarque_conseiller) cc.textContent=e.remarque_conseiller;
}

function renderNotes(n){
  if(!n) return;
  ['an1_s1','an1_s2','moy_an1','an2_s1','an2_s2','moy_an2',
   'moy_nationale','moy_gen_bac','moy_25reg_75nat'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.innerHTML=fmtNote(n[id]);
  });
}

function renderStats(cands){
  var cnt={inscrit:0,preselect:0,convoque:0,principale:0,
           attente_1:0,attente_2:0,attente_3:0,confirme:0,refuse:0,en_cours:0};
  cands.forEach(function(c){ if(cnt[c.statut]!==undefined) cnt[c.statut]++; });
  var items=[
    {l:'Total',     v:cands.length,                              cls:'cs-total'},
    {l:'Inscrits',  v:cnt.inscrit+cnt.preselect+cnt.convoque,    cls:'cs-inscrit'},
    {l:'Admis',     v:cnt.principale+cnt.confirme,               cls:'cs-admis'},
    {l:'En attente',v:cnt.attente_1+cnt.attente_2+cnt.attente_3, cls:'cs-attente'},
    {l:'En cours',  v:cnt.en_cours,                              cls:'cs-cours'},
    {l:'Non retenus',v:cnt.refuse,                               cls:'cs-refuse'}
  ];
  var el=document.getElementById('stats-row');
  if(el) el.innerHTML=items.filter(function(i){return i.v>0||i.l==='Total';}).map(function(i){
    return '<div class="stat-box '+i.cls+'"><div class="stat-val">'+i.v+'</div><div class="stat-lbl">'+i.l+'</div></div>';
  }).join('');
  var nb=document.getElementById('nb-cand');
  if(nb) nb.textContent=cands.length+' candidature'+(cands.length>1?'s':'');
}

function renderTable(cands){
  var tbody=document.getElementById('tbody');
  if(!tbody) return;
  tbody.innerHTML=cands.map(function(c,i){
    var st=ST[c.statut]||ST['en_cours'];
    var recu=c.recu_inscription===true?'<span class="liste-oui">✅</span>':
             c.recu_inscription===false?'<span class="liste-non">⏳</span>':'<span class="cell-na">—</span>';
    var lien=c.lien?'<a class="btn-lien-sm" href="'+c.lien+'" target="_blank">🔗</a>':'—';
    var note=c.note_conseiller?'<span class="note-cons-sm">'+c.note_conseiller+'</span>':'<span class="cell-na">—</span>';
    return '<tr class="tr-'+(i%2===0?'even':'odd')+'">'
      +'<td class="tc c-num">'+(i+1)+'</td>'
      +'<td class="c-ecole"><strong>'+c.ecole+'</strong>'+(c.groupe?'<div class="ecole-groupe">'+c.groupe+'</div>':'')+'</td>'
      +'<td class="tc">'+(c.ville||'—')+'</td>'
      +'<td class="tc">'+fmtDate(c.date_inscription)+'</td>'
      +'<td class="tc">'+fmtDate(c.date_concours)+'</td>'
      +'<td class="tc">'+recu+'</td>'
      +'<td class="tc"><span class="statut-badge '+st.cls+'">'+st.label+'</span></td>'
      +'<td class="tc">'+listeBadge(c.liste_principale)+'</td>'
      +'<td class="tc">'+listeBadge(c.attente_1)+'</td>'
      +'<td class="tc">'+listeBadge(c.attente_2)+'</td>'
      +'<td class="tc">'+listeBadge(c.attente_3)+'</td>'
      +'<td>'+note+'</td>'
      +'<td class="tc">'+lien+'</td>'
      +'</tr>';
  }).join('');
}

function renderCards(cands){
  var grid=document.getElementById('cards-mobile');
  if(!grid) return;
  grid.innerHTML=cands.map(function(c,i){
    var st=ST[c.statut]||ST['en_cours'];
    var lien=c.lien?'<a class="card-btn-link" href="'+c.lien+'" target="_blank">🔗 Site officiel</a>':'';
    var listes='';
    if(c.liste_principale!==null&&c.liste_principale!==undefined)
      listes+='<div class="card-liste-item"><span class="cli-k">Liste princ.</span>'+listeBadge(c.liste_principale)+'</div>';
    if(c.attente_1!==null&&c.attente_1!==undefined)
      listes+='<div class="card-liste-item"><span class="cli-k">Attente 1</span>'+listeBadge(c.attente_1)+'</div>';
    if(c.attente_2!==null&&c.attente_2!==undefined)
      listes+='<div class="card-liste-item"><span class="cli-k">Attente 2</span>'+listeBadge(c.attente_2)+'</div>';
    if(c.attente_3!==null&&c.attente_3!==undefined)
      listes+='<div class="card-liste-item"><span class="cli-k">Attente 3</span>'+listeBadge(c.attente_3)+'</div>';
    return '<div class="cand-card">'
      +'<div class="cand-card-header">'
        +'<div class="cand-num">'+(i+1)+'</div>'
        +'<span class="statut-badge '+st.cls+'">'+st.label+'</span>'
      +'</div>'
      +'<div class="cand-card-nom">'+c.ecole+'</div>'
      +(c.groupe?'<div class="cand-card-groupe">'+c.groupe+' · '+(c.ville||'')+'</div>':'')
      +'<div class="cand-card-infos">'
        +'<div class="ci-item"><span class="ci-k">📅 Inscription</span><span class="ci-v">'+fmtDate(c.date_inscription)+'</span></div>'
        +'<div class="ci-item"><span class="ci-k">🎯 Concours</span><span class="ci-v">'+fmtDate(c.date_concours)+'</span></div>'
      +'</div>'
      +(listes?'<div class="cand-listes">'+listes+'</div>':'')
      +(c.note_conseiller?'<div class="cand-note">💬 '+c.note_conseiller+'</div>':'')
      +(lien?'<div style="margin-top:10px">'+lien+'</div>':'')
      +'</div>';
  }).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  initDark();
  initBac();
  document.getElementById('darkToggle').addEventListener('click',toggleDark);
  document.getElementById('btnPrint').addEventListener('click',function(){ window.print(); });
  fetch('etudiants.json')
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data){
      var e=data[0]; if(!e) return;
      document.title='Deciplan — '+(e.prenom||'Étudiant');
      renderProfil(e); renderNotes(e.notes);
      renderStats(e.candidatures);
      renderTable(e.candidatures);
      renderCards(e.candidatures);
    })
    .catch(function(err){ console.error(err); });
});
