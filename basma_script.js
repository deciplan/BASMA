/* ===== Deciplan — Suivi Étudiant script.js v1 ===== */

var STATUTS = {
  inscrit     : { label:'📝 Inscrit',            cls:'s-inscrit',    prio:1 },
  preselect   : { label:'📋 Présélectionné',      cls:'s-preselect',  prio:2 },
  convoque    : { label:'📅 Convoqué',            cls:'s-convoque',   prio:3 },
  principale  : { label:'🏆 Liste principale',    cls:'s-principal',  prio:4 },
  attente_1   : { label:'🟡 1ère liste attente',  cls:'s-attente1',   prio:5 },
  attente_2   : { label:'🟠 2ème liste attente',  cls:'s-attente2',   prio:6 },
  attente_3   : { label:'🔶 3ème liste attente',  cls:'s-attente3',   prio:7 },
  confirme    : { label:'✅ Inscrit · Confirmé',  cls:'s-confirme',   prio:0 },
  refuse      : { label:'❌ Non retenu',           cls:'s-refuse',     prio:8 },
  en_cours    : { label:'⏳ En traitement',        cls:'s-cours',      prio:9 }
};

/* ── Dark mode ── */
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

/* ── Countdown Bac ── */
function initBac(){
  var bac=new Date(2026,5,4);
  var diff=Math.round((bac-new Date().setHours(0,0,0,0))/86400000);
  var el=document.getElementById('countdownBac');
  var banner=document.querySelector('.bac-banner');
  if(!el) return;
  if(diff>0){
    el.textContent='Bac dans '+diff+' jours — 04 · 05 · 06 Juin 2026';
    if(diff<=30&&banner) banner.classList.add('urgent');
  } else {
    el.textContent='Bac en cours — Bon courage !';
    if(banner) banner.classList.add('urgent');
  }
}

/* ── Utilitaires ── */
function fmtNote(n){
  if(n===null||n===undefined) return '<span class="note-na">—</span>';
  var v=parseFloat(n);
  var cls=v>=14?'note-good':v>=12?'note-avg':'note-low';
  return '<span class="'+cls+'">'+v.toFixed(2)+' /20</span>';
}
function fmtDate(s){
  if(!s||s==='— À confirmer —'||s==='— À compléter —') return s||'—';
  if(s.indexOf('-')>0){
    var p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0];
  }
  return s;
}
function moyenne(e){
  var vals=[e.note_regionale,e.note_s1,e.note_s2].filter(function(v){return v!==null&&v!==undefined;});
  if(!vals.length) return null;
  return (vals.reduce(function(a,b){return a+b;},0)/vals.length);
}

/* ── Profil ── */
function renderProfil(e){
  /* Photo */
  var ph=document.getElementById('profile-photo');
  if(ph&&e.photo_b64){
    ph.src='data:image/jpeg;base64,'+e.photo_b64;
    ph.alt=e.prenom||e.nom;
  }

  /* Nom */
  var nomEl=document.getElementById('profile-nom');
  if(nomEl) nomEl.textContent=e.nom&&e.nom!=='— À compléter —'?e.nom:(e.prenom||'Étudiante');

  /* Filière */
  var filEl=document.getElementById('profile-filiere');
  if(filEl) filEl.textContent=(e.serie_bac||e.filiere_bac||'—')+' · Bac '+(e.annee_bac||2026);

  /* Tags */
  var tags=[
    {k:'CIN',v:e.cin},{k:'CNE',v:e.cne},{k:'Massar',v:e.massar},
    {k:'Né(e) le',v:e.date_naissance},{k:'Ville',v:e.ville},
    {k:'Académie',v:e.academie},{k:'Tél',v:e.telephone}
  ];
  var tagsEl=document.getElementById('profile-tags');
  if(tagsEl){
    tagsEl.innerHTML=tags.map(function(t){
      var val=t.v&&t.v!=='— À compléter —'?t.v:'—';
      return '<span class="id-tag"><strong>'+t.k+' :</strong> '+val+'</span>';
    }).join('');
  }

  /* Notes */
  var moy=moyenne(e);
  var notesData=[
    {label:'Note régionale',val:e.note_regionale},
    {label:'Semestre 1',    val:e.note_s1},
    {label:'Semestre 2',    val:e.note_s2},
    {label:'Note Bac',      val:e.note_bac},
    {label:'Moyenne',       val:moy,bold:true}
  ];
  var ng=document.getElementById('notes-grid');
  if(ng){
    ng.innerHTML=notesData.map(function(n){
      return '<div class="note-box'+(n.bold?' note-box-main':'')+'"><div class="note-label">'+n.label+'</div><div class="note-val">'+fmtNote(n.val)+'</div></div>';
    }).join('');
  }

  /* Conseil */
  var cc=document.getElementById('conseil-text');
  if(cc&&e.remarque_conseiller) cc.textContent=e.remarque_conseiller;
}

/* ── Stats ── */
function renderStats(cands){
  var counts={inscrit:0,preselect:0,convoque:0,principale:0,
               attente_1:0,attente_2:0,attente_3:0,confirme:0,refuse:0,en_cours:0};
  cands.forEach(function(c){ if(counts[c.statut]!==undefined) counts[c.statut]++; });

  var items=[
    {label:'Total',     val:cands.length,      cls:'cs-total'},
    {label:'Inscrits',  val:counts.inscrit+counts.preselect+counts.convoque, cls:'cs-inscrit'},
    {label:'Admis',     val:counts.principale+counts.confirme, cls:'cs-admis'},
    {label:'En attente',val:counts.attente_1+counts.attente_2+counts.attente_3, cls:'cs-attente'},
    {label:'En cours',  val:counts.en_cours,   cls:'cs-cours'},
    {label:'Non retenus',val:counts.refuse,    cls:'cs-refuse'}
  ];

  var el=document.getElementById('stats-row');
  if(el){
    el.innerHTML=items.filter(function(i){return i.val>0||i.label==='Total';}).map(function(i){
      return '<div class="stat-box '+i.cls+'"><div class="stat-val">'+i.val+'</div><div class="stat-label">'+i.label+'</div></div>';
    }).join('');
  }
  document.getElementById('nb-cand').textContent=cands.length+' établissement'+(cands.length>1?'s':'');
}

/* ── Candidatures ── */
function renderCandidatures(cands){
  var container=document.getElementById('candidatures-container');
  if(!container) return;

  container.innerHTML=cands.map(function(c,idx){
    var st=STATUTS[c.statut]||STATUTS['en_cours'];
    var listeInfo='';
    if(c.liste){
      var ls=STATUTS[c.liste]; if(ls) listeInfo=ls.label;
    }

    /* Programmes */
    var progsHtml='';
    if(c.programmes&&c.programmes.length){
      progsHtml='<div class="prog-section">'
        +'<div class="prog-title">📚 Programmes sélectionnés</div>'
        +'<ol class="prog-list">'
        +c.programmes.map(function(p){
          return '<li>'+p.replace(/^Choix \d+ : /,'')+'</li>';
        }).join('')
        +'</ol></div>';
    }

    /* Infos dates */
    var infosHtml='<div class="cand-infos">'
      +'<div class="cand-info-item"><span class="cand-info-label">📍 Ville</span><span class="cand-info-val">'+(c.ville||'—')+'</span></div>'
      +'<div class="cand-info-item"><span class="cand-info-label">📁 N° dossier</span><span class="cand-info-val">'+(c.num_dossier||'—')+'</span></div>'
      +'<div class="cand-info-item"><span class="cand-info-label">📅 Date inscription</span><span class="cand-info-val">'+fmtDate(c.date_inscription)+'</span></div>'
      +'<div class="cand-info-item"><span class="cand-info-label">🎯 Date concours</span><span class="cand-info-val">'+fmtDate(c.date_concours)+'</span></div>'
      +'<div class="cand-info-item"><span class="cand-info-label">📢 Résultats</span><span class="cand-info-val">'+fmtDate(c.date_resultats)+'</span></div>'
      +(listeInfo?'<div class="cand-info-item"><span class="cand-info-label">🏅 Liste</span><span class="cand-info-val">'+listeInfo+'</span></div>':'')
      +'</div>';

    /* Note conseiller */
    var noteHtml='';
    if(c.note_conseiller){
      noteHtml='<div class="cand-note-conseiller"><span>💬 '+c.note_conseiller+'</span></div>';
    }

    /* Bouton lien */
    var lienHtml='';
    if(c.lien) lienHtml='<a class="btn-lien" href="'+c.lien+'" target="_blank" rel="noopener">🔗 Site officiel</a>';

    return '<div class="cand-card">'
      +'<div class="cand-card-header">'
        +'<div class="cand-num-badge">'+(idx+1)+'</div>'
        +'<div class="cand-header-info">'
          +'<div class="cand-ecole-nom">'+c.ecole+'</div>'
          +'<div class="cand-header-sub">'+(c.ville||'')+'</div>'
        +'</div>'
        +'<div class="cand-statut-wrap">'
          +'<span class="statut-badge '+st.cls+'">'+st.label+'</span>'
          +(lienHtml?lienHtml:'')
        +'</div>'
      +'</div>'
      +'<div class="cand-card-body">'
        +infosHtml
        +progsHtml
        +noteHtml
      +'</div>'
      +'</div>';
  }).join('');
}

/* ── Print ── */
function initPrint(){
  var btn=document.getElementById('btnPrint');
  if(btn) btn.addEventListener('click',function(){ window.print(); });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded',function(){
  initDark();
  initBac();
  initPrint();
  document.getElementById('darkToggle').addEventListener('click',toggleDark);

  /* Charger le JSON */
  fetch('etudiants.json')
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data){
      /* Prendre le premier étudiant (ou par ID dans l'URL) */
      var id=new URLSearchParams(window.location.search).get('id');
      var e=id?data.find(function(x){return x.id===id;}):data[0];
      if(!e){ document.body.innerHTML='<div style="padding:40px;text-align:center">❌ Étudiant introuvable</div>'; return; }
      document.title='Deciplan — '+((e.prenom||'')+' '+(e.nom||'')).trim();
      renderProfil(e);
      renderStats(e.candidatures);
      renderCandidatures(e.candidatures);
    })
    .catch(function(err){
      console.error(err);
      document.body.innerHTML='<div style="padding:40px;text-align:center">⚠️ Impossible de charger les données.</div>';
    });
});
