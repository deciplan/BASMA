/* ===== Deciplan — BASMA script.js ===== */

var STATUTS = {
  inscrit    : { label:'📝 Inscrit',            cls:'s-inscrit'   },
  preselect  : { label:'📋 Présélectionné',      cls:'s-preselect' },
  convoque   : { label:'📅 Convoqué',            cls:'s-convoque'  },
  principale : { label:'🏆 Liste principale',    cls:'s-principal' },
  attente_1  : { label:'🟡 1ère liste attente',  cls:'s-attente1'  },
  attente_2  : { label:'🟠 2ème liste attente',  cls:'s-attente2'  },
  attente_3  : { label:'🔶 3ème liste attente',  cls:'s-attente3'  },
  confirme   : { label:'✅ Confirmé',            cls:'s-confirme'  },
  refuse     : { label:'❌ Non retenu',           cls:'s-refuse'    },
  en_cours   : { label:'⏳ En traitement',        cls:'s-cours'     }
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

/* ── Utilitaires ── */
function fmtNote(n){
  if(n===null||n===undefined) return '<span class="note-na">—</span>';
  var v=parseFloat(n);
  var cls=v>=14?'note-good':v>=12?'note-avg':'note-low';
  return '<span class="'+cls+'">'+v.toFixed(2)+' /20</span>';
}
function fmtDate(s){
  if(!s||s.indexOf('—')>=0||s.indexOf('À')>=0) return s||'—';
  if(s.match(/^\d{4}-\d{2}-\d{2}$/)){
    var p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0];
  }
  return s;
}
function moy(e){
  var vals=[e.note_regionale,e.note_s1,e.note_s2].filter(function(v){return v!==null&&v!==undefined;});
  if(!vals.length) return null;
  return vals.reduce(function(a,b){return a+b;},0)/vals.length;
}

/* ── Profil ── */
function renderProfil(e){
  var ph=document.getElementById('profile-photo');
  if(ph&&e.photo_b64) ph.src='data:image/jpeg;base64,'+e.photo_b64;

  var nomEl=document.getElementById('profile-nom');
  if(nomEl){
    var nom=(e.nom&&e.nom.indexOf('À')<0)?e.nom:'';
    nomEl.textContent=nom||(e.prenom||'Étudiante');
  }

  var filEl=document.getElementById('profile-filiere');
  if(filEl){
    var fil=[];
    if(e.serie_bac&&e.serie_bac.indexOf('À')<0) fil.push(e.serie_bac);
    else if(e.filiere_bac&&e.filiere_bac.indexOf('À')<0) fil.push(e.filiere_bac);
    fil.push('Bac '+(e.annee_bac||2026));
    filEl.textContent=fil.join(' · ');
  }

  var tagsEl=document.getElementById('profile-tags');
  if(tagsEl){
    var tags=[
      {k:'CIN',v:e.cin},{k:'CNE',v:e.cne},{k:'Massar',v:e.massar},
      {k:'Né(e) le',v:e.date_naissance},{k:'Ville',v:e.ville},
      {k:'Académie',v:e.academie},{k:'Tél',v:e.telephone}
    ];
    tagsEl.innerHTML=tags.map(function(t){
      var val=(t.v&&t.v.indexOf('À')<0&&t.v!=='—')?t.v:'—';
      return '<span class="id-tag"><strong>'+t.k+' :</strong> '+val+'</span>';
    }).join('');
  }

  var ng=document.getElementById('notes-grid');
  if(ng){
    var m=moy(e);
    var notes=[
      {label:'Note rég.',val:e.note_regionale},
      {label:'Semestre 1',val:e.note_s1},
      {label:'Semestre 2',val:e.note_s2},
      {label:'Note Bac',  val:e.note_bac},
      {label:'Moyenne',   val:m,bold:true}
    ];
    ng.innerHTML=notes.map(function(n){
      return '<div class="note-box'+(n.bold?' note-box-main':'')+'"><div class="note-label">'+n.label+'</div><div class="note-val">'+fmtNote(n.val)+'</div></div>';
    }).join('');
  }

  var cc=document.getElementById('conseil-text');
  if(cc&&e.remarque_conseiller) cc.textContent=e.remarque_conseiller;
}

/* ── Stats ── */
function renderStats(cands){
  var cnt={inscrit:0,preselect:0,convoque:0,principale:0,attente_1:0,attente_2:0,attente_3:0,confirme:0,refuse:0,en_cours:0};
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
    return '<div class="stat-box '+i.cls+'"><div class="stat-val">'+i.v+'</div><div class="stat-label">'+i.l+'</div></div>';
  }).join('');

  var nb=document.getElementById('nb-cand');
  if(nb) nb.textContent=cands.length+' établissement'+(cands.length>1?'s':'');
}

/* ── Candidatures ── */
function renderCandidatures(cands){
  var container=document.getElementById('candidatures-container');
  if(!container) return;

  container.innerHTML=cands.map(function(c,i){
    var st=STATUTS[c.statut]||STATUTS['en_cours'];
    var lstSt=c.liste?STATUTS[c.liste]:null;

    /* Infos */
    var infos=[
      {l:'📍 Ville',          v:c.ville},
      {l:'📁 N° dossier',     v:c.num_dossier},
      {l:'📅 Date inscription',v:fmtDate(c.date_inscription)},
      {l:'🎯 Date concours',   v:fmtDate(c.date_concours)},
      {l:'📢 Résultats',       v:fmtDate(c.date_resultats)},
      {l:'🏅 Liste',           v:lstSt?lstSt.label:null}
    ];
    var infosHtml='<div class="cand-infos">'+infos.filter(function(x){return x.v;}).map(function(x){
      return '<div class="cand-info-item"><span class="cand-info-label">'+x.l+'</span><span class="cand-info-val">'+x.v+'</span></div>';
    }).join('')+'</div>';

    /* Programmes */
    var progsHtml='';
    if(c.programmes&&c.programmes.length){
      progsHtml='<div class="prog-section"><div class="prog-title">📚 Programmes sélectionnés</div><ol class="prog-list">'
        +c.programmes.map(function(p,pi){
          return '<li data-num="'+(pi+1)+'">'+p.replace(/^Choix \d+ : /,'')+'</li>';
        }).join('')+'</ol></div>';
    }

    /* Note conseiller */
    var noteHtml=c.note_conseiller?'<div class="cand-note">💬 '+c.note_conseiller+'</div>':'';
    var lienHtml=c.lien?'<a class="btn-lien" href="'+c.lien+'" target="_blank" rel="noopener">🔗 Site officiel</a>':'';

    return '<div class="cand-card">'
      +'<div class="cand-header">'
        +'<div class="cand-num">'+(i+1)+'</div>'
        +'<div class="cand-header-info">'
          +'<div class="cand-nom">'+c.ecole+'</div>'
          +'<div class="cand-ville">'+(c.ville||'')+'</div>'
        +'</div>'
        +'<div class="cand-statut-col">'
          +'<span class="statut-badge '+st.cls+'">'+st.label+'</span>'
          +lienHtml
        +'</div>'
      +'</div>'
      +'<div class="cand-body">'+infosHtml+progsHtml+noteHtml+'</div>'
      +'</div>';
  }).join('');
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded',function(){
  initDark();
  initBac();

  document.getElementById('darkToggle').addEventListener('click',toggleDark);
  document.getElementById('btnPrint').addEventListener('click',function(){ window.print(); });

  fetch('etudiants.json')
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(data){
      var e=data[0];
      if(!e) return;
      document.title='Deciplan — '+(e.prenom||'Étudiant');
      renderProfil(e);
      renderStats(e.candidatures);
      renderCandidatures(e.candidatures);
    })
    .catch(function(err){ console.error('Erreur:',err); });
});
