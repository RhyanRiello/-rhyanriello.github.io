(()=>{
'use strict';
const body=document.body, systemMotion=matchMedia('(prefers-reduced-motion: reduce)'), finePointer=matchMedia('(pointer:fine)');
let saved=null;try{saved=localStorage.getItem('rhyan-motion')}catch{}
let active=!systemMotion.matches && saved!=='reduced';
const button=document.createElement('button');button.type='button';button.className='motion-dock';button.id='motion-mode';body.append(button);
const progress=document.createElement('div');progress.className='motion-progress';progress.setAttribute('aria-hidden','true');body.append(progress);
const cursor=document.createElement('div');cursor.className='motion-focus';cursor.setAttribute('aria-hidden','true');body.append(cursor);
const hero=document.querySelector('.alpine-hero'), heroMain=document.querySelector('.hero-main'),person=document.querySelector('.hero-person-correct'),word=document.querySelector('.hero-name'),contact=document.querySelector('.contact');
const heading=hero.querySelector('h1');heading.innerHTML='<span class="motion-line">IDEIAS SEM</span><span class="motion-line">FRONTEIRAS</span>';
const ribbon=document.querySelector('.ticker');const ribbonContents=ribbon.innerHTML;ribbon.innerHTML='<div class="ticker-track"><div class="ticker-group">'+ribbonContents+'</div><div class="ticker-group">'+ribbonContents+'</div></div>';
const running=new Set();
function animate(el,frames,options){if(!active||!el)return;const a=el.animate(frames,{...options,fill:'backwards'});running.add(a);a.finished.then(()=>running.delete(a)).catch(()=>running.delete(a));return a;}
function setMode(next){active=next&&!systemMotion.matches;body.classList.toggle('motion-full',active);body.classList.toggle('motion-lite',!active);button.textContent=active?'Movimento: intenso':'Movimento: reduzido';button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?'Reduzir os movimentos do site':'Ativar movimentos intensos');if(!active){running.forEach(a=>a.cancel());cursor.style.opacity=0;hero.style.removeProperty('--light-x');hero.style.removeProperty('--light-y');}scheduleFrame();document.dispatchEvent(new Event('portfolio-motion-change'));}
button.addEventListener('click',()=>{setMode(!active);saved=active?'intense':'reduced';try{localStorage.setItem('rhyan-motion',saved)}catch{}});
systemMotion.addEventListener('change',()=>setMode(!systemMotion.matches && saved!=='reduced'));
let pending=false,heroVisible=true,mouseX=0,mouseY=0;
function frame(){pending=false;const y=window.scrollY,total=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress.style.transform='scaleX('+Math.min(1,y/total)+')';if(!active)return;
 if(heroVisible){const depth=Math.min(y,hero.offsetHeight);word.style.setProperty('--name-x',(-depth*.18)+'px');word.style.setProperty('--name-y',(depth*.07)+'px');person.style.setProperty('--person-y',(depth*.1+mouseY*7)+'px');person.style.setProperty('--person-x',(mouseX*10)+'px');heroMain.style.setProperty('--copy-y',(-depth*.045)+'px');}
 const r=contact.getBoundingClientRect();if(r.top<innerHeight && r.bottom>0)contact.style.setProperty('--contact-x',(Math.max(-1,Math.min(1,(r.top-innerHeight*.5)/innerHeight))*18)+'px');
}
function scheduleFrame(){if(!pending){pending=true;requestAnimationFrame(frame)}}
window.addEventListener('scroll',scheduleFrame,{passive:true});window.addEventListener('resize',scheduleFrame,{passive:true});
const visibility=new IntersectionObserver(entries=>entries.forEach(e=>{e.target.classList.toggle('motion-active',e.isIntersecting);if(e.target===hero)heroVisible=e.isIntersecting;}));[hero,ribbon,document.querySelector('.signature-block')].forEach(el=>visibility.observe(el));
const seen=new WeakSet();const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting||seen.has(e.target))return;seen.add(e.target);reveal.unobserve(e.target);if(!active)return;const card=e.target.matches('.project');const title=e.target.matches('h2');animate(e.target,[{opacity:0,transform:card?'translateY(75px) rotate(2deg) scale(.96)':'translateY(48px)',filter:title?'blur(12px)':'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:card?950:800,delay:card?Number(e.target.dataset.motionIndex||0)%2*100:0,easing:'cubic-bezier(.16,1,.3,1)'});}),{threshold:.12});
document.querySelectorAll('.section-head h2,.project,.about h2,.about p,.portrait,.facts,.practice,.contact h2,.contact-row').forEach((el,i)=>{el.dataset.motionIndex=i;reveal.observe(el)});
document.querySelectorAll('.project').forEach(card=>{card.addEventListener('pointermove',e=>{if(!active||!finePointer.matches)return;const r=card.getBoundingClientRect();card.style.setProperty('--tilt-x',(-(e.clientY-r.top-r.height/2)/r.height*8)+'deg');card.style.setProperty('--tilt-y',((e.clientX-r.left-r.width/2)/r.width*10)+'deg')});card.addEventListener('pointerleave',()=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg')});});
document.addEventListener('pointermove',e=>{if(!active||!finePointer.matches)return;const link=!!e.target.closest('a,button');cursor.classList.toggle('is-link',link);const size=link?72:44;cursor.style.opacity='.8';cursor.style.transform='translate3d('+(e.clientX-size/2)+'px,'+(e.clientY-size/2)+'px,0)';if(heroVisible){const r=hero.getBoundingClientRect();mouseX=(e.clientX-r.left)/r.width-.5;mouseY=(e.clientY-r.top)/r.height-.5;hero.style.setProperty('--light-x',((mouseX+.5)*100)+'%');hero.style.setProperty('--light-y',((mouseY+.5)*100)+'%');scheduleFrame();}},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>cursor.style.opacity=0);
document.addEventListener('visibilitychange',()=>{body.classList.toggle('motion-background',document.hidden);if(!document.hidden)scheduleFrame()});
setMode(active);
if(active){
 animate(person,[{opacity:0,scale:1.12,filter:'blur(14px)'},{opacity:1,scale:1,filter:'blur(0px)'}],{duration:1400,easing:'cubic-bezier(.16,1,.3,1)'});
 animate(word,[{opacity:0,translate:'120px 0',filter:'blur(16px)'},{opacity:.17,translate:'0 0',filter:'blur(0px)'}],{duration:1500,easing:'cubic-bezier(.16,1,.3,1)'});
 heading.querySelectorAll('.motion-line').forEach((el,i)=>animate(el,[{opacity:0,transform:'translateY(100%) rotateX(-45deg)',filter:'blur(12px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:1000,delay:180+i*150,easing:'cubic-bezier(.16,1,.3,1)'}));
 [heroMain.querySelector('.label'),heroMain.querySelector('p'),heroMain.querySelector('.alpine-cta')].forEach((el,i)=>animate(el,[{opacity:0,transform:'translateY(25px)',filter:'blur(5px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:800,delay:350+i*100,easing:'cubic-bezier(.16,1,.3,1)'}));
}
})();
