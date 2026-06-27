import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = '/api/entries';
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmt  = n => 'PKR ' + Math.round(n).toLocaleString('en-PK');
const today = new Date();

const CAT = {
  Food:{icon:'🍔',color:'#f59e0b',bg:'rgba(245,158,11,.15)'},
  Transport:{icon:'🚗',color:'#3b82f6',bg:'rgba(59,130,246,.15)'},
  Shopping:{icon:'🛍️',color:'#a855f7',bg:'rgba(168,85,247,.15)'},
  Bills:{icon:'💡',color:'#10b981',bg:'rgba(16,185,129,.15)'},
  Health:{icon:'❤️',color:'#ef4444',bg:'rgba(239,68,68,.15)'},
  Entertainment:{icon:'🎮',color:'#ec4899',bg:'rgba(236,72,153,.15)'},
  Education:{icon:'📚',color:'#06b6d4',bg:'rgba(6,182,212,.15)'},
  Other:{icon:'📦',color:'#64748b',bg:'rgba(100,116,139,.15)'},
  Salary:{icon:'💼',color:'#10b981',bg:'rgba(16,185,129,.15)'},
  Freelance:{icon:'💻',color:'#3b82f6',bg:'rgba(59,130,246,.15)'},
  Investment:{icon:'📈',color:'#8b5cf6',bg:'rgba(139,92,246,.15)'},
  Gift:{icon:'🎁',color:'#f59e0b',bg:'rgba(245,158,11,.15)'},
};

const EXP_CATS = ['Food','Transport','Shopping','Bills','Health','Entertainment','Education','Other'];
const INC_CATS = ['Salary','Freelance','Investment','Gift'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [entries, setEntries]   = useState([]);
  const [budget, setBudget]     = useState(50000);
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(true);
  const [viewOffset, setViewOffset] = useState(0);
  const [selType, setSelType]   = useState('expense');
  const [selCat, setSelCat]     = useState('Food');
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [toast, setToast]       = useState('');
  const [formName, setFormName] = useState('');
  const [formAmt, setFormAmt]   = useState('');
  const [formDate, setFormDate] = useState(today.toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(false);

  useEffect(() => {
    axios.get(API, { headers: hdrs() })
      .then(({ data }) => { setEntries(data.entries); setBudget(data.budget); setUsername(data.username); setLoading(false); })
      .catch(err => { if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); } setLoading(false); });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const addEntry = async () => {
    if (!formName.trim() || !formAmt || parseFloat(formAmt) <= 0) return;
    try {
      const { data } = await axios.post(API, {
        name: formName.trim(), amount: parseFloat(formAmt), category: selCat,
        type: selType, date: formDate, recurring,
      }, { headers: hdrs() });
      setEntries(prev => [data, ...prev]);
      setFormName(''); setFormAmt(''); setRecurring(false);
      showToast(recurring ? '🔁 Recurring added!' : selType === 'income' ? '💰 Income added!' : '💸 Expense added!');
    } catch { showToast('❌ Failed to add entry'); }
  };

  const deleteEntry = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, { headers: hdrs() });
      setEntries(prev => prev.filter(e => e._id !== id));
      showToast('🗑 Deleted');
    } catch { showToast('❌ Failed to delete'); }
  };

  const clearAll = async () => {
    if (!confirm('Delete all entries?')) return;
    await axios.delete(API, { headers: hdrs() });
    setEntries([]); showToast('🗑 All cleared');
  };

  const editBudget = async () => {
    const n = parseInt(prompt('Set monthly budget (PKR):', budget));
    if (!n || n <= 0) return;
    await axios.put(`${API}/budget`, { budget: n }, { headers: hdrs() });
    setBudget(n); showToast('✅ Budget updated');
  };

  const exportCSV = () => {
    if (!entries.length) return showToast('No data to export');
    const rows = [['Date','Description','Category','Type','Amount (PKR)','Recurring'],
      ...entries.map(e => [e.date,e.name,e.category,e.type,e.amount,e.recurring?'Yes':'No'])];
    const csv = rows.map(r => r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'spendtrack.csv'; a.click();
    showToast('📥 Exported!');
  };

  const getViewKey = () => {
    const d = new Date(today.getFullYear(), today.getMonth() + viewOffset, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };
  const getViewLabel = () => {
    const d = new Date(today.getFullYear(), today.getMonth() + viewOffset, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const viewKey     = getViewKey();
  const monthEntries = entries.filter(e => e.recurring || (e.date && e.date.startsWith(viewKey)));
  const spent   = monthEntries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);
  const income  = monthEntries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
  const balance = income - spent;
  const biggest = [...monthEntries].filter(e=>e.type==='expense').sort((a,b)=>b.amount-a.amount)[0];
  const budPct  = Math.min((spent/budget)*100,100);
  const budClr  = budPct>=90?'linear-gradient(90deg,#ef4444,#f97316)':budPct>=70?'linear-gradient(90deg,#f59e0b,#10b981)':'linear-gradient(90deg,#10b981,#3b82f6)';

  const catTotals = {};
  monthEntries.filter(e=>e.type==='expense').forEach(e=>{ catTotals[e.category]=(catTotals[e.category]||0)+e.amount; });

  const filtered = monthEntries.filter(e => {
    if (filter==='expense' && e.type!=='expense') return false;
    if (filter==='income'  && e.type!=='income')  return false;
    if (filter==='recurring' && !e.recurring)     return false;
    const q = search.toLowerCase();
    if (q && !e.name.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false;
    return true;
  });

  const months6 = Array.from({length:6},(_,i)=>{
    const d = new Date(today.getFullYear(), today.getMonth()-(5-i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const total = entries.filter(e=>e.type==='expense'&&(e.recurring||(e.date&&e.date.startsWith(key)))).reduce((s,e)=>s+e.amount,0);
    return { label: d.toLocaleDateString('en-US',{month:'short'}), key, total };
  });
  const maxM = Math.max(...months6.map(m=>m.total),1);
  const curKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  const donutSegs = () => {
    if (!spent) return null;
    const R=70,CX=90,CY=90,SW=20,circ=2*Math.PI*R;
    const sorted = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
    let off=0;
    return sorted.map(([cat,amt])=>{
      const pct=amt/spent, dash=circ*pct;
      const seg=<circle key={cat} cx={CX} cy={CY} r={R} fill="none" stroke={CAT[cat]?.color||'#64748b'} strokeWidth={SW} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-off*circ}/>;
      off+=pct; return seg;
    });
  };

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#060c18',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'36px',height:'36px',border:'3px solid rgba(59,130,246,.2)',borderTopColor:'#3b82f6',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
      <p style={{color:'#64748b',marginTop:'16px',fontFamily:"'Inter',sans-serif"}}>Loading your finances...</p>
    </div>
  );

  return (
    <div style={{background:'#060c18',minHeight:'100vh',padding:'80px 24px 80px',fontFamily:"'Inter',sans-serif",position:'relative'}}>
      <div style={{position:'fixed',width:'600px',height:'600px',borderRadius:'50%',background:'rgba(59,130,246,.06)',top:'-200px',left:'-200px',filter:'blur(100px)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',width:'500px',height:'500px',borderRadius:'50%',background:'rgba(139,92,246,.05)',bottom:'-150px',right:'-150px',filter:'blur(100px)',pointerEvents:'none'}}/>

      {/* TOAST */}
      {toast && <div style={{position:'fixed',bottom:'28px',left:'50%',transform:'translateX(-50%)',background:'rgba(13,20,38,.98)',border:'1px solid rgba(59,130,246,.3)',color:'#f1f5f9',fontSize:'13px',fontWeight:'600',padding:'12px 24px',borderRadius:'12px',zIndex:999,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{toast}</div>}

      <div style={{maxWidth:'1180px',margin:'0 auto',position:'relative',zIndex:1}}>
        {/* TOPBAR */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'28px',flexWrap:'wrap',gap:'16px'}}>
          <div>
            <h1 style={{fontSize:'1.5rem',fontWeight:'900',color:'#f1f5f9',letterSpacing:'-.5px'}}>
              Hey {username} 👋
            </h1>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'6px'}}>
              <button onClick={()=>{setViewOffset(v=>v-1);}} style={navBtn}>‹</button>
              <span style={{fontSize:'13px',color:'#64748b',fontWeight:'600',minWidth:'130px',textAlign:'center'}}>{getViewLabel()}</span>
              <button onClick={()=>{if(viewOffset<0)setViewOffset(v=>v+1);}} disabled={viewOffset>=0} style={{...navBtn,opacity:viewOffset>=0?.3:1}}>›</button>
              {viewOffset===0 && <span style={{fontSize:'9px',background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',color:'#3b82f6',padding:'2px 7px',borderRadius:'10px',fontWeight:'700'}}>NOW</span>}
            </div>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <button style={ghostBtn} onClick={exportCSV}>⬇ Export CSV</button>
            <button style={primaryBtn} onClick={()=>document.getElementById('expName').focus()}>+ Add Entry</button>
          </div>
        </div>

        {/* HERO STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'20px'}}>
          {[
            {label:'💸 Total Spent',  val:fmt(spent),   cls:'#ef4444'},
            {label:'💰 Total Income', val:fmt(income),  cls:'#10b981'},
            {label:'📊 Net Balance',  val:fmt(balance), cls:balance>=0?'#10b981':'#ef4444'},
            {label:'🔥 Biggest',      val:biggest?fmt(biggest.amount):'—', note:biggest?.name||'no expenses', cls:'#f59e0b'},
          ].map((s,i)=>(
            <div key={i} style={{background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'18px',padding:'20px 18px',backdropFilter:'blur(20px)'}}>
              <div style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>{s.label}</div>
              <div style={{fontSize:'22px',fontWeight:'900',color:s.cls,marginBottom:'4px'}}>{s.val}</div>
              {s.note && <div style={{fontSize:'11px',color:'#64748b'}}>{s.note}</div>}
            </div>
          ))}
        </div>

        {/* BUDGET BAR */}
        <div style={{background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'18px',padding:'20px 24px',marginBottom:'20px',backdropFilter:'blur(20px)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <span style={{fontSize:'13px',fontWeight:'700',color:'#f1f5f9'}}>Monthly Budget</span>
            <button onClick={editBudget} style={{background:'none',border:'none',color:'#64748b',fontSize:'12px',cursor:'pointer'}}>✏ Edit Budget</button>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'12px',color:'#64748b'}}>
            <span>Spent: <strong style={{color:'#f1f5f9'}}>{fmt(spent)}</strong></span>
            <span>Budget: <strong style={{color:'#f1f5f9'}}>{fmt(budget)}</strong></span>
            <span>Remaining: <strong style={{color:'#f1f5f9'}}>{fmt(Math.max(budget-spent,0))}</strong></span>
          </div>
          <div style={{height:'10px',background:'rgba(30,41,59,.8)',borderRadius:'6px',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:'6px',width:`${budPct}%`,background:budClr,transition:'width 1s'}}/>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:'20px'}}>
          {/* FORM */}
          <div style={{background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'18px',padding:'24px',backdropFilter:'blur(20px)',position:'sticky',top:'80px',alignSelf:'start'}}>
            <div style={{fontSize:'11px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'18px'}}>New Entry</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'14px'}}>
              {['expense','income'].map(t=>(
                <button key={t} onClick={()=>{setSelType(t);setSelCat(t==='income'?'Salary':'Food');}} style={{padding:'9px',borderRadius:'10px',border:`1.5px solid ${selType===t?(t==='expense'?'#ef4444':'#10b981'):'rgba(255,255,255,.07)'}`,background:selType===t?(t==='expense'?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)'):'rgba(30,41,59,.5)',color:selType===t?(t==='expense'?'#ef4444':'#10b981'):'#64748b',fontWeight:'600',fontSize:'13px',cursor:'pointer'}}>
                  {t==='expense'?'💸 Expense':'💰 Income'}
                </button>
              ))}
            </div>
            {[
              {id:'expName',  label:'Description', type:'text',   ph:'e.g. Grocery, Salary', val:formName, set:setFormName},
              {id:'expAmt',   label:'Amount (PKR)', type:'number', ph:'0', val:formAmt, set:setFormAmt},
            ].map(f=>(
              <div key={f.id} style={{marginBottom:'12px'}}>
                <label style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',display:'block',marginBottom:'5px'}}>{f.label}</label>
                <input id={f.id} type={f.type} placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)} style={{width:'100%',background:'rgba(30,41,59,.7)',border:'1.5px solid rgba(255,255,255,.07)',borderRadius:'11px',color:'#f1f5f9',fontSize:'14px',padding:'10px 13px',outline:'none',fontFamily:'inherit'}}/>
              </div>
            ))}
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',display:'block',marginBottom:'5px'}}>Category</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>
                {(selType==='income'?INC_CATS:EXP_CATS).map(c=>(
                  <button key={c} onClick={()=>setSelCat(c)} style={{padding:'7px 3px',borderRadius:'9px',border:`1.5px solid ${selCat===c?'#3b82f6':'rgba(255,255,255,.07)'}`,background:selCat===c?'rgba(59,130,246,.15)':'rgba(30,41,59,.5)',color:selCat===c?'#93c5fd':'#64748b',fontSize:'10px',fontWeight:'600',cursor:'pointer',textAlign:'center'}}>
                    <span style={{display:'block',fontSize:'16px',marginBottom:'1px'}}>{CAT[c]?.icon}</span>{c}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',display:'block',marginBottom:'5px'}}>Date</label>
              <input type="date" value={formDate} onChange={e=>setFormDate(e.target.value)} style={{width:'100%',background:'rgba(30,41,59,.7)',border:'1.5px solid rgba(255,255,255,.07)',borderRadius:'11px',color:'#f1f5f9',fontSize:'14px',padding:'10px 13px',outline:'none',fontFamily:'inherit'}}/>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:'9px',padding:'10px 12px',background:'rgba(30,41,59,.5)',border:`1.5px solid ${recurring?'rgba(99,102,241,.5)':'rgba(255,255,255,.07)'}`,borderRadius:'11px',cursor:'pointer',marginBottom:'14px',transition:'all .2s'}}>
              <input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)} style={{width:'15px',height:'15px',accentColor:'#6366f1'}}/>
              <span style={{fontSize:'13px',color:'#94a3b8',fontWeight:'500'}}>🔁 Recurring every month</span>
            </label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 42px',gap:'8px'}}>
              <button onClick={addEntry} style={{...primaryBtn,padding:'12px',justifyContent:'center',display:'flex'}}>Add Entry</button>
              <button onClick={clearAll} style={{padding:'12px',border:'1.5px solid rgba(239,68,68,.3)',borderRadius:'11px',background:'rgba(239,68,68,.08)',color:'#ef4444',fontSize:'17px'}}>🗑</button>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            {/* DONUT + CATS */}
            <div style={card}>
              <div style={sectionTitle}>Spending Breakdown</div>
              <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:'24px',alignItems:'center'}}>
                <div style={{position:'relative',width:'180px',height:'180px'}}>
                  {spent ? (
                    <>
                      <svg viewBox="0 0 180 180" style={{width:'180px',height:'180px',transform:'rotate(-90deg)'}}>
                        {donutSegs()}
                      </svg>
                      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                        <div style={{fontSize:'16px',fontWeight:'900',color:'#f1f5f9'}}>PKR {Math.round(spent/1000)}k</div>
                        <div style={{fontSize:'9px',color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',marginTop:'2px'}}>Spent</div>
                      </div>
                    </>
                  ) : (
                    <div style={{width:'180px',height:'180px',borderRadius:'50%',border:'18px solid rgba(30,41,59,.8)',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b',fontSize:'12px'}}>No data</div>
                  )}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cat,amt])=>{
                    const pct = spent ? Math.round((amt/spent)*100) : 0;
                    const m = CAT[cat]||CAT.Other;
                    return (
                      <div key={cat}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                            <div style={{width:'26px',height:'26px',borderRadius:'7px',background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>{m.icon}</div>
                            <span style={{fontSize:'12px',fontWeight:'600',color:'#94a3b8'}}>{cat}</span>
                            <span style={{fontSize:'10px',color:'#64748b'}}>{pct}%</span>
                          </div>
                          <span style={{fontSize:'13px',fontWeight:'700',color:'#f1f5f9'}}>{fmt(amt)}</span>
                        </div>
                        <div style={{height:'4px',background:'rgba(30,41,59,.8)',borderRadius:'4px',overflow:'hidden'}}>
                          <div style={{height:'100%',background:m.color,width:`${pct}%`,borderRadius:'4px',transition:'width .8s'}}/>
                        </div>
                      </div>
                    );
                  })}
                  {!Object.keys(catTotals).length && <span style={{fontSize:'12px',color:'#64748b'}}>No categories yet</span>}
                </div>
              </div>
            </div>

            {/* MONTHLY CHART */}
            <div style={card}>
              <div style={sectionTitle}>Last 6 Months</div>
              <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'8px',height:'120px',paddingTop:'12px'}}>
                {months6.map((m,i)=>(
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',flex:1}}>
                    <span style={{fontSize:'9px',color:'#94a3b8',fontWeight:'600'}}>{m.total>0?`PKR ${(m.total/1000).toFixed(1)}k`:''}</span>
                    <div style={{flex:1,width:'100%',display:'flex',alignItems:'flex-end'}}>
                      <div style={{width:'100%',borderRadius:'5px 5px 0 0',minHeight:'4px',height:`${Math.max((m.total/maxM)*100,3)}%`,background:'linear-gradient(180deg,#3b82f6,#8b5cf6)',opacity:m.key===curKey?1:m.key===viewKey?.85:.55,boxShadow:m.key===curKey?'0 0 16px rgba(59,130,246,.5)':m.key===viewKey?'0 0 12px rgba(139,92,246,.5)':'none',transition:'height .8s'}}/>
                    </div>
                    <span style={{fontSize:'9px',color:'#64748b',fontWeight:'600',textTransform:'uppercase'}}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TRANSACTIONS */}
            <div style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <div style={sectionTitle}>Transactions</div>
                <span style={{fontSize:'11px',color:'#64748b'}}>{filtered.length} entries</span>
              </div>
              <div style={{position:'relative',marginBottom:'12px'}}>
                <span style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',color:'#64748b',fontSize:'14px'}}>🔍</span>
                <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',background:'rgba(30,41,59,.7)',border:'1.5px solid rgba(255,255,255,.07)',borderRadius:'11px',color:'#f1f5f9',fontSize:'13px',padding:'10px 14px 10px 36px',outline:'none',fontFamily:'inherit'}}/>
              </div>
              <div style={{display:'flex',gap:'7px',flexWrap:'wrap',marginBottom:'14px'}}>
                {['all','expense','income','recurring'].map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?'rgba(59,130,246,.15)':'rgba(30,41,59,.7)',border:`1px solid ${filter===f?'rgba(59,130,246,.4)':'rgba(255,255,255,.07)'}`,color:filter===f?'#93c5fd':'#64748b',fontSize:'11px',fontWeight:'600',padding:'5px 13px',borderRadius:'18px',cursor:'pointer'}}>
                    {f==='recurring'?'🔁 Recurring':f.charAt(0).toUpperCase()+f.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px',maxHeight:'400px',overflowY:'auto',paddingRight:'4px'}}>
                {!filtered.length ? (
                  <div style={{textAlign:'center',padding:'40px',color:'#64748b',fontSize:'13px'}}>
                    <div style={{fontSize:'36px',marginBottom:'12px'}}>📭</div>
                    No transactions found.
                  </div>
                ) : filtered.map(e => {
                  const m = CAT[e.category]||CAT.Other;
                  const d = new Date(e.date+'T00:00:00');
                  return (
                    <div key={e._id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(30,41,59,.45)',border:`1px solid ${e.recurring?'rgba(99,102,241,.2)':'rgba(255,255,255,.07)'}`,borderRadius:'13px',padding:'13px 15px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'11px'}}>
                        <div style={{width:'38px',height:'38px',borderRadius:'11px',background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',flexShrink:0}}>{m.icon}</div>
                        <div>
                          <div style={{fontSize:'13px',fontWeight:'700',color:'#f1f5f9',display:'flex',alignItems:'center',gap:'6px'}}>
                            {e.name}
                            {e.recurring && <span style={{fontSize:'9px',background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.25)',color:'#a5b4fc',padding:'2px 6px',borderRadius:'5px',fontWeight:'700'}}>🔁</span>}
                          </div>
                          <div style={{fontSize:'11px',color:'#64748b',marginTop:'2px'}}>{e.category} · {d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{fontSize:'14px',fontWeight:'900',color:e.type==='income'?'#10b981':'#ef4444'}}>{e.type==='income'?'+':'−'}{fmt(e.amount)}</div>
                        <button onClick={()=>deleteEntry(e._id)} style={{width:'28px',height:'28px',borderRadius:'7px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.15)',color:'#ef4444',cursor:'pointer',fontSize:'11px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const card = {background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'18px',padding:'22px',backdropFilter:'blur(20px)'};
const sectionTitle = {fontSize:'11px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'18px'};
const primaryBtn = {background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',border:'none',padding:'10px 20px',borderRadius:'11px',fontWeight:'700',fontSize:'13px',cursor:'pointer',boxShadow:'0 4px 16px rgba(59,130,246,.35)'};
const ghostBtn   = {background:'rgba(30,41,59,.7)',border:'1px solid rgba(255,255,255,.07)',color:'#94a3b8',fontSize:'13px',fontWeight:'600',padding:'10px 16px',borderRadius:'11px',cursor:'pointer'};
const navBtn = {background:'rgba(30,41,59,.8)',border:'1px solid rgba(255,255,255,.07)',color:'#94a3b8',width:'25px',height:'25px',borderRadius:'6px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',justifyContent:'center'};
