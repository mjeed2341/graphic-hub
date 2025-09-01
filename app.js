// i18n strings
const STR = {
  ar: {
    framesTitle: "إطارات جاهزة",
    uploadImage: "رفع صورة",
    download: "تحميل",
    paletteTitle: "مولّد ألوان",
    generate: "توليد",
    save: "حفظ",
    fontsTitle: "معاينة خطوط",
    fontsHint: "ارفع ملف خط (TTF/OTF) للمعاينة.",
    uploadFont: "رفع خط",
    templatesTitle: "قوالب سريعة",
    create: "إنشاء",
    favorites: "المفضلة"
  },
  en: {
    framesTitle: "Ready Frames",
    uploadImage: "Upload Image",
    download: "Download",
    paletteTitle: "Color Generator",
    generate: "Generate",
    save: "Save",
    fontsTitle: "Font Preview",
    fontsHint: "Upload a font file (TTF/OTF) to preview.",
    uploadFont: "Upload Font",
    templatesTitle: "Quick Templates",
    create: "Create",
    favorites: "Favorites"
  }
};

let lang = localStorage.getItem('gh_lang') || 'ar';
document.documentElement.lang = lang;
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

function applyI18n(){
  const strings = STR[lang];
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(strings[key]) el.textContent = strings[key];
  });
}
applyI18n();

// theme toggle (auto at night)
const themeToggle = document.getElementById('themeToggle');
const hour = new Date().getHours();
if (hour >= 19 || hour < 6) document.body.classList.add('night');
themeToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('night');
});

// language toggle
document.getElementById('langToggle').addEventListener('click', ()=>{
  lang = (lang==='ar'?'en':'ar');
  localStorage.setItem('gh_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang==='ar'?'rtl':'ltr';
  applyI18n();
});

// Tabs
const tabButtons = document.querySelectorAll('.tabs button');
const tabs = document.querySelectorAll('.tab');
tabButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    tabButtons.forEach(b=>b.classList.remove('active'));
    tabs.forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

// Favorites drawer
const favPanel = document.getElementById('favoritesPanel');
document.getElementById('favOpen').onclick = ()=>favPanel.classList.add('open');
document.getElementById('favClose').onclick = ()=>favPanel.classList.remove('open');
const favListEl = document.getElementById('favList');
const FAV_KEY = 'gh_favorites';
let favorites = JSON.parse(localStorage.getItem(FAV_KEY)||'[]');
function renderFav(){ favListEl.innerHTML = favorites.map((f,i)=>`<div class="fav-item"><small>${f.type}</small><div>${f.label||''}</div></div>`).join(''); }
renderFav();
function addFav(item){ favorites.unshift(item); localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); renderFav(); }

// -------- Frames --------
const frameList = document.getElementById('frameList');
const frameCanvas = document.getElementById('frameCanvas');
const fctx = frameCanvas.getContext('2d');
const frames = [
  {name:'Gold', src:'assets/frames/gold.png'},
  {name:'Wood', src:'assets/frames/wood.png'},
  {name:'Neon', src:'assets/frames/neon.png'},
];
let currentFrame = null;
let userImage = null;

function loadFrames(){
  frames.forEach((fr,i)=>{
    const d = document.createElement('div');
    d.className = 'frame-thumb';
    const img = new Image();
    img.src = fr.src;
    d.appendChild(img);
    d.onclick = ()=>{
      document.querySelectorAll('.frame-thumb').forEach(x=>x.classList.remove('active'));
      d.classList.add('active');
      currentFrame = fr;
      drawFrame();
      document.getElementById('favFrame').disabled = false;
    };
    frameList.appendChild(d);
    if(i===0){ d.click(); } // select first by default
  });
}
loadFrames();

document.getElementById('uploadImage').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const img = new Image();
  img.onload = ()=>{ userImage = img; drawFrame(); document.getElementById('downloadFramed').disabled = false; };
  img.src = URL.createObjectURL(file);
});

function drawFrame(){
  fctx.clearRect(0,0,frameCanvas.width, frameCanvas.height);
  if(userImage){
    const W = frameCanvas.width, H = frameCanvas.height;
    const ir = userImage.width / userImage.height;
    const cr = W / H;
    let dw, dh;
    if(ir > cr){ dh = H; dw = dh * ir; } else { dw = W; dh = dw / ir; }
    const dx = (W - dw)/2, dy = (H - dh)/2;
    fctx.drawImage(userImage, dx, dy, dw, dh);
  } else {
    fctx.fillStyle = '#0e1420'; fctx.fillRect(0,0,frameCanvas.width, frameCanvas.height);
    fctx.fillStyle = '#2a3550'; fctx.fillRect(40,40,frameCanvas.width-80, frameCanvas.height-80);
  }
  if(currentFrame){
    const overlay = new Image();
    overlay.onload = ()=>{ fctx.drawImage(overlay, 0,0, frameCanvas.width, frameCanvas.height); };
    overlay.src = currentFrame.src;
  }
}

document.getElementById('downloadFramed').onclick = ()=>{
  const link = document.createElement('a');
  link.download = 'framed.png';
  link.href = frameCanvas.toDataURL('image/png');
  link.click();
};
document.getElementById('favFrame').onclick = ()=> addFav({type:'frame', label: currentFrame?.name || 'Frame'});

// -------- Palettes --------
const paletteEl = document.getElementById('palette');
function randHue(){ return Math.floor(Math.random()*360); }
function hslToHex(h,s,l){
  s/=100; l/=100;
  const k = n => (n + h/30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1)));
  const toHex = x => Math.round(x*255).toString(16).padStart(2,'0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
function genPalette(){
  paletteEl.innerHTML = '';
  const base = randHue();
  const cols = [0,40,200,240,300].map((off,i)=>{
    const h = (base+off)%360;
    const s = 65 - i*5;
    const l = 50 + (i%2?10:-5);
    return hslToHex(h,s,l);
  });
  cols.forEach(hex=>{
    const div = document.createElement('div');
    div.className='swatch';
    div.style.background = hex;
    const sp = document.createElement('span'); sp.textContent = hex;
    div.appendChild(sp);
    div.onclick = ()=>{
      navigator.clipboard.writeText(hex);
      sp.textContent = (lang==='ar'?'نُسخ':'Copied!')+' '+hex;
      setTimeout(()=>sp.textContent=hex,1000);
    };
    paletteEl.appendChild(div);
  });
  return cols;
}
let currentPalette = genPalette();
document.getElementById('genPalette').onclick = ()=> currentPalette = genPalette();
document.getElementById('savePalette').onclick = ()=> addFav({type:'palette', label: currentPalette.join(', ')});
document.getElementById('downloadPalette').onclick = ()=>{
  const w=1000,h=220; const cw=document.createElement('canvas'); cw.width=w; cw.height=h; const c=cw.getContext('2d');
  currentPalette.forEach((hex,i)=>{
    c.fillStyle = hex; c.fillRect(i*(w/5),0,(w/5),h);
    c.fillStyle='rgba(0,0,0,.5)'; c.fillRect(i*(w/5)+10, h-50, 180, 40);
    c.fillStyle='#fff'; c.font='20px sans-serif'; c.fillText(hex, i*(w/5)+20, h-22);
  });
  const a=document.createElement('a'); a.download='palette.png'; a.href=cw.toDataURL('image/png'); a.click();
};

// -------- Fonts (upload + preview) --------
const uploadFont = document.getElementById('uploadFont');
const fontPreview = document.getElementById('fontPreview');
const fontSample = document.getElementById('fontSample');
let customFontName = null;
uploadFont.addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const data = await file.arrayBuffer();
  const blob = new Blob([data], {type: file.type});
  const url = URL.createObjectURL(blob);
  customFontName = 'CustomFont_'+Date.now();
  const font = new FontFace(customFontName, `url(${url})`);
  await font.load();
  document.fonts.add(font);
  fontPreview.style.fontFamily = `'${customFontName}', system-ui, sans-serif`;
  fontPreview.textContent = fontSample.value;
});
fontSample.addEventListener('input', ()=>{
  fontPreview.textContent = fontSample.value;
});

// -------- Templates (blank sizes + guides) --------
const tplCanvas = document.getElementById('tplCanvas');
const tctx = tplCanvas.getContext('2d');
function drawTemplate(w,h){
  tplCanvas.width=w; tplCanvas.height=h;
  tctx.fillStyle = '#0f141f'; tctx.fillRect(0,0,w,h);
  const m = Math.floor(Math.min(w,h)*0.05);
  tctx.strokeStyle='#2d3a55'; tctx.lineWidth=2;
  tctx.strokeRect(m,m,w-2*m,h-2*m);
  tctx.strokeStyle='rgba(255,255,255,0.06)'; tctx.lineWidth=1;
  const step = Math.floor(Math.min(w,h)/10);
  for(let x=m; x<w-m; x+=step){ tctx.beginPath(); tctx.moveTo(x,m); tctx.lineTo(x,h-m); tctx.stroke(); }
  for(let y=m; y<h-m; y+=step){ tctx.beginPath(); tctx.moveTo(m,y); tctx.lineTo(w-m,y); tctx.stroke(); }
  tctx.strokeStyle='rgba(255,255,255,0.15)';
  tctx.beginPath(); tctx.moveTo(w/2,m); tctx.lineTo(w/2,h-m); tctx.stroke();
  tctx.beginPath(); tctx.moveTo(m,h/2); tctx.lineTo(w-m,h/2); tctx.stroke();
  tctx.fillStyle='#9fb5ff'; tctx.font='16px system-ui'; tctx.fillText(`${w}x${h}`, 12, 24);
}
document.getElementById('makeTpl').onclick = ()=>{
  const val = document.getElementById('tplSize').value;
  const [w,h] = val.split('x').map(Number);
  drawTemplate(w,h);
  document.getElementById('downloadTpl').disabled=false;
  document.getElementById('favTpl').disabled=false;
};
document.getElementById('downloadTpl').onclick = ()=>{
  const a=document.createElement('a'); a.download='template.png'; a.href=tplCanvas.toDataURL('image/png'); a.click();
};
document.getElementById('favTpl').onclick = ()=>{
  const val = document.getElementById('tplSize').value;
  addFav({type:'template', label: val});
};

// PWA service worker
if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js'); }
