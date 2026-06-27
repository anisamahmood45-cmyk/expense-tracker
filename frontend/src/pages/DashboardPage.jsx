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
  const fileRef  = useRef(null);

  const [entries, setEntries]         = useState([]);
  const [budget, setBudget]           = useState(50000);
  const [catBudgets, setCatBudgets]   = useState({});
  const [username, setUsername]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [viewOffset, setViewOffset]   = useState(0);
  const [selType, setSelType]         = useState('expense');
  const [selCat, setSelCat]           = useState('Food');
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [toast, setToast]             = useState('');
  const [activeTab, setActiveTab]     = useState('transactions');
  const [formName, setFormName]       = useState('');
  const [formAmt, setFormAmt]         = useState('');
  const [formDate, setFormDate]       = useState(today.toISOString().split('T')[0]);
  const [recurring, setRecurring]     = useState(false);

  const [editEntry, setEditEntry]         = useState(null);
  const [editName, setEditName]           = useState('');
  const [editAmt, setEditAmt]             = useState('');
  const [editCat, setEditCat]             = useState('');
  const [editType, setEditType]           = useState('expense');
  const [editDate, setEditDate]           = useState('');
  const [editRecurring, setEditRecurring] = useState(false);

  useEffect(() => {
    axios.get(API, { headers: hdrs() })
      .then(({ data }) => {
        setEntries(data.entries);
        setBudget(data.budget);
        setCatBudgets(data.categoryBudgets || {});
        setUsername(data.username);
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
        setLoading(false);
      });
  }, []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2400); };

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

  const deleteEntry = async id => {
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

  const openEdit = e => {
    setEditEntry(e); setEditName(e.name); setEditAmt(String(e.amount));
    setEditCat(e.category); setEditType(e.type); setEditDate(e.date); setEditRecurring(e.recurring);
  };

  const saveEdit = async () => {
    try {
      const { data } = await axios.put(`${API}/${editEntry._id}`, {
        name: editName, amount: parseFloat(editAmt), category: editCat,
        type: editType, date: editDate, recurring: editRecurring,
      }, { headers: hdrs() });
      setEntries(prev => prev.map(e => e._id === data._id ? data : e));
      setEditEntry(null);
      showToast('✅ Updated!');
    } catch { showToast('❌ Update failed'); }
  };

  const editBudget = async () => {
    const n = parseInt(prompt('Set monthly budget (PKR):', budget));
    if (!n || n <= 0) return;
    await axios.put(`${API}/budget`, { budget: n }, { headers: hdrs() });
    setBudget(n); showToast('✅ Budget updated');
  };

  const saveCatBudget = async (cat, val) => {
    const num = parseFloat(val);
    const updated = { ...catBudgets, [cat]: isNaN(num) || num <= 0 ? 0 : num };
    setCatBudgets(updated);
    await axios.put(`${API}/category-budget`, { categoryBudgets: updated }, { headers: hdrs() });
  };

  const exportCSV = () => {
    if (!entries.length) return showToast('No data to export');
    const rows = [['Date','Description','Category','Type','Amount (PKR)','Recurring'],
      ...entries.map(e => [e.date, e.name, e.category, e.type, e.amount, e.recurring ? 'Yes' : 'No'])];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'spendtrack.csv'; a.click();
    showToast('📥 Exported!');
  };

  const importCSV = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const lines = ev.target.result.split('\n').slice(1).filter(Boolean);
      let added = 0;
      for (const line of lines) {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        const [date, name, category, type, amount, rec] = cols;
        if (!name || !amount || isNaN(parseFloat(amount))) continue;
        try {
          const { data } = await axios.post(API, {
            name, amount: parseFloat(amount),
            category: CAT[category] ? category : 'Other',
            type: type === 'income' ? 'income' : 'expense',
            date: date || today.toISOString().split('T')[0],
            recurring: rec?.toLowerCase() === 'yes',
          }, { headers: hdrs() });
          setEntries(prev => [data, ...prev]);
          added++;
        } catch {}
      }
      showToast(`📂 Imported ${added} entries`);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const getViewKey = () => {
    const d = new Date(today.getFullYear(), today.getMonth() + viewOffset, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };
  const getViewLabel = () => {
    const d = new Date(today.getFullYear(), today.getMonth() + viewOffset, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  const getPrevKey = () => {
    const d = new Date(today.getFullYear(), today.getMonth() + viewOffset - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };

  const viewKey      = getViewKey();
  const prevKey      = getPrevKey();
  const monthEntries = entries.filter(e => e.recurring || (e.date && e.date.startsWith(viewKey)));
  const prevEntries  = entries.filter(e => e.recurring || (e.date && e.date.startsWith(prevKey)));
  const spent        = monthEntries.filter(e => e.type === 'expense').reduce((s,e) => s + e.amount, 0);
  const income       = monthEntries.filter(e => e.type === 'income').reduce((s,e) => s + e.amount, 0);
  const prevSpent    = prevEntries.filter(e => e.type === 'expense').reduce((s,e) => s + e.amount, 0);
  const balance      = income - spent;
  const budPct       = Math.min((spent / budget) * 100, 100);
  const budClr       = budPct >= 90 ? 'linear-gradient(90deg,#ef4444,#f97316)' : budPct >= 70 ? 'linear-gradient(90deg,#f59e0b,#10b981)' : 'linear-gradient(90deg,#10b981,#3b82f6)';
  const avgDaily     = spent > 0 ? Math.round(spent / Math.min(today.getDate(), 28)) : 0;
  const spentDiff    = spent - prevSpent;
  const spentDiffPct = prevSpent ? ((spentDiff / prevSpent) * 100).toFixed(1) : null;

  const catTotals = {};
  monthEntries.filter(e => e.type === 'expense').forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

  const filtered = monthEntries.filter(e => {
    if (filter === 'expense'   && e.type !== 'expense')   return false;
    if (filter === 'income'    && e.type !== 'income')    return false;
    if (filter === 'recurring' && !e.recurring)           return false;
    const q = search.toLowerCase();
    if (q && !e.name.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false;
    return true;
  });

  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d   = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const total = entries.filter(e => e.type === 'expense' && (e.recurring || (e.date && e.date.startsWith(key)))).reduce((s,e) => s + e.amount, 0);
    return { label: d.toLocaleDateString('en-US', { month: 'short' }), key, total };
  });
  const maxM   = Math.max(...months6.map(m => m.total), 1);
  const curKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

  const catInsights = EXP_CATS.map(cat => {
    const cur  = catTotals[cat] || 0;
    const prev = prevEntries.filter(e => e.type === 'expense' && e.category === cat).reduce((s,e) => s + e.amount, 0);
    return { cat, cur, prev, diff: cur - prev, pct: prev ? ((cur - prev) / prev * 100).toFixed(0) : null };
  }).filter(r => r.cur > 0 || r.prev > 0).sort((a,b) => b.cur - a.cur);

  const donutSegs = () => {
    if (!spent) return null;
    const R = 70, CX = 90, CY = 90, SW = 20, circ = 2 * Math.PI * R;
    const sorted = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
    let off = 0;
    return sorted.map(([cat, amt]) => {
      const pct = amt / spent, dash = circ * pct;
      const seg = <circle key={cat} cx={CX} cy={CY} r={R} fill="none" stroke={CAT[cat]?.color||'#64748b'} strokeWidth={SW} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-off*circ}/>;
      off += pct; return seg;
    });
  };

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#060c18',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'36px',height:'36px',border:'3px solid rgba(59,130,246,.2)',borderTopColor:'#3b82f6',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
      <p style={{color:'#64748b',marginTop:'16px',fontFamily:"'Inter',sans-serif"}}>Loading...</p>
    </div>
  );

  return (
    <div style={{background:'#060c18',minHeight:'100vh',padding:'80px 16px 80px',fontFamily:"'Inter',sans-serif",position:'relative'}}>
      <div style={{position:'fixed',width:'600px',height:'600px',borderRadius:'50%',background:'rgba(59,130,246,.06)',top:'-200px',left:'-200px',filter:'blur(100px)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',width:'500px',height:'500px',borderRadius:'50%',background:'rgba(139,92,246,.05)',bottom:'-150px',right:'-150px',filter:'blur(100px)',pointerEvents:'none'}}/>

      {toast && <div style={{position:'fixed',bottom:'28px',left:'50%',transform:'translateX(-50%)',background:'rgba(13,20,38,.98)',border:'1px solid rgba(59,130,246,.3)',color:'#f1f5f9',fontSize:'13px',fontWeight:'600',padding:'12px 24px',borderRadius:'12px',zIndex:999,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{toast}</div>}

      {/* EDIT MODAL */}
      {editEntry && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',zIndex:900,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={e=>e.target===e.currentTarget&&setEditEntry(null)}>
          <div style={{background:'rgba(13,20,38,.98)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'22px',padding:'26px',width:'100%',maxWidth:'420px',backdropFilter:'blur(24px)'}}>
            <div style={{fontSize:'14px',fontWeight:'800',color:'#f1f5f9',marginBottom:'18px'}}>✏️ Edit Transaction</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px',marginBottom:'13px'}}>
              {['expense','income'].map(t=>(
                <button key={t} onClick={()=>{setEditType(t);setEditCat(t==='income'?'Salary':'Food');}} style={{padding:'8px',borderRadius:'10px',border:`1.5px solid ${editType===t?(t==='expense'?'#ef4444':'#10b981'):'rgba(255,255,255,.07)'}`,background:editType===t?(t==='expense'?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)'):'rgba(30,41,59,.5)',color:editType===t?(t==='expense'?'#ef4444':'#10b981'):'#64748b',fontWeight:'600',fontSize:'12px',cursor:'pointer'}}>
                  {t==='expense'?'💸 Expense':'💰 Income'}
                </button>
              ))}
            </div>
            {[{label:'Description',val:editName,set:setEditName,type:'text'},{label:'Amount (PKR)',val:editAmt,set:setEditAmt,type:'number'}].map(f=>(
              <div key={f.label} style={{marginBottom:'11px'}}>
                <label style={lbl}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} style={{...inp,width:'100%'}}/>
              </div>
            ))}
            <div style={{marginBottom:'11px'}}>
              <label style={lbl}>Category</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'4px'}}>
                {(editType==='income'?INC_CATS:EXP_CATS).map(c=>(
                  <button key={c} onClick={()=>setEditCat(c)} style={{padding:'6px 2px',borderRadius:'8px',border:`1.5px solid ${editCat===c?'#3b82f6':'rgba(255,255,255,.07)'}`,background:editCat===c?'rgba(59,130,246,.15)':'rgba(30,41,59,.5)',color:editCat===c?'#93c5fd':'#64748b',fontSize:'9px',fontWeight:'600',cursor:'pointer',textAlign:'center'}}>
                    <span style={{display:'block',fontSize:'14px',marginBottom:'1px'}}>{CAT[c]?.icon}</span>{c}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:'11px'}}>
              <label style={lbl}>Date</label>
              <input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} style={{...inp,width:'100%'}}/>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',background:'rgba(30,41,59,.5)',border:`1.5px solid ${editRecurring?'rgba(99,102,241,.5)':'rgba(255,255,255,.07)'}`,borderRadius:'10px',cursor:'pointer',marginBottom:'14px'}}>
              <input type="checkbox" checked={editRecurring} onChange={e=>setEditRecurring(e.target.checked)} style={{width:'14px',height:'14px',accentColor:'#6366f1'}}/>
              <span style={{fontSize:'12px',color:'#94a3b8',fontWeight:'500'}}>🔁 Recurring every month</span>
            </label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'9px'}}>
              <button onClick={()=>setEditEntry(null)} style={{...ghostBtn,justifyContent:'center',display:'flex'}}>Cancel</button>
              <button onClick={saveEdit} style={{...primaryBtn,justifyContent:'center',display:'flex'}}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:'1180px',margin:'0 auto',position:'relative',zIndex:1}}>
        {/* TOPBAR */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'22px',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <h1 style={{fontSize:'1.4rem',fontWeight:'900',color:'#f1f5f9',letterSpacing:'-.5px'}}>Hey {username} 👋</h1>
            <div style={{display:'flex',alignItems:'center',gap:'7px',marginTop:'6px'}}>
              <button onClick={()=>setViewOffset(v=>v-1)} style={navBtn}>‹</button>
              <span style={{fontSize:'13px',color:'#64748b',fontWeight:'600',minWidth:'130px',textAlign:'center'}}>{getViewLabel()}</span>
              <button onClick={()=>{if(viewOffset<0)setViewOffset(v=>v+1);}} disabled={viewOffset>=0} style={{...navBtn,opacity:viewOffset>=0?.3:1}}>›</button>
              {viewOffset===0&&<span style={{fontSize:'9px',background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',color:'#3b82f6',padding:'2px 7px',borderRadius:'10px',fontWeight:'700'}}>NOW</span>}
            </div>
          </div>
          <div style={{display:'flex',gap:'7px',flexWrap:'wrap'}}>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={importCSV}/>
            <button style={ghostBtn} onClick={()=>fileRef.current.click()}>📂 Import</button>
            <button style={ghostBtn} onClick={exportCSV}>⬇ Export</button>
            <button style={primaryBtn} onClick={()=>document.getElementById('expName').focus()}>+ Add</button>
          </div>
        </div>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px'}}>
          {[
            {label:'💸 Spent',   val:fmt(spent),   cls:'#ef4444'},
            {label:'💰 Income',  val:fmt(income),  cls:'#10b981'},
            {label:'📊 Balance', val:fmt(balance), cls:balance>=0?'#10b981':'#ef4444'},
            {label:'📅 Daily',   val:'PKR '+avgDaily.toLocaleString(), cls:'#f59e0b'},
          ].map((s,i)=>(
            <div key={i} style={{background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'15px',padding:'16px 14px',backdropFilter:'blur(20px)'}}>
              <div style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'6px'}}>{s.label}</div>
              <div style={{fontSize:'18px',fontWeight:'900',color:s.cls}}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* BUDGET */}
        <div style={{background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'15px',padding:'16px 20px',marginBottom:'16px',backdropFilter:'blur(20px)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'9px'}}>
            <span style={{fontSize:'13px',fontWeight:'700',color:'#f1f5f9'}}>Monthly Budget</span>
            <button onClick={editBudget} style={{background:'none',border:'none',color:'#64748b',fontSize:'12px',cursor:'pointer'}}>✏ Edit</button>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'7px',fontSize:'11px',color:'#64748b',flexWrap:'wrap',gap:'4px'}}>
            <span>Spent: <strong style={{color:'#f1f5f9'}}>{fmt(spent)}</strong></span>
            <span>Budget: <strong style={{color:'#f1f5f9'}}>{fmt(budget)}</strong></span>
            <span>Left: <strong style={{color:'#f1f5f9'}}>{fmt(Math.max(budget-spent,0))}</strong></span>
          </div>
          <div style={{height:'8px',background:'rgba(30,41,59,.8)',borderRadius:'5px',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:'5px',width:`${budPct}%`,background:budClr,transition:'width 1s'}}/>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'16px'}}>
          {/* FORM */}
          <div style={{background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'18px',padding:'20px',backdropFilter:'blur(20px)',position:'sticky',top:'80px',alignSelf:'start'}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'14px'}}>New Entry</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px',marginBottom:'12px'}}>
              {['expense','income'].map(t=>(
                <button key={t} onClick={()=>{setSelType(t);setSelCat(t==='income'?'Salary':'Food');}} style={{padding:'8px',borderRadius:'10px',border:`1.5px solid ${selType===t?(t==='expense'?'#ef4444':'#10b981'):'rgba(255,255,255,.07)'}`,background:selType===t?(t==='expense'?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)'):'rgba(30,41,59,.5)',color:selType===t?(t==='expense'?'#ef4444':'#10b981'):'#64748b',fontWeight:'600',fontSize:'12px',cursor:'pointer'}}>
                  {t==='expense'?'💸 Expense':'💰 Income'}
                </button>
              ))}
            </div>
            <div style={{marginBottom:'10px'}}>
              <label style={lbl}>Description</label>
              <input id="expName" type="text" placeholder="e.g. Grocery" value={formName} onChange={e=>setFormName(e.target.value)} style={{...inp,width:'100%'}}/>
            </div>
            <div style={{marginBottom:'10px'}}>
              <label style={lbl}>Amount (PKR)</label>
              <input type="number" placeholder="0" value={formAmt} onChange={e=>setFormAmt(e.target.value)} style={{...inp,width:'100%'}}/>
            </div>
            <div style={{marginBottom:'10px'}}>
              <label style={lbl}>Category</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'4px'}}>
                {(selType==='income'?INC_CATS:EXP_CATS).map(c=>(
                  <button key={c} onClick={()=>setSelCat(c)} style={{padding:'6px 2px',borderRadius:'8px',border:`1.5px solid ${selCat===c?'#3b82f6':'rgba(255,255,255,.07)'}`,background:selCat===c?'rgba(59,130,246,.15)':'rgba(30,41,59,.5)',color:selCat===c?'#93c5fd':'#64748b',fontSize:'9px',fontWeight:'600',cursor:'pointer',textAlign:'center'}}>
                    <span style={{display:'block',fontSize:'14px',marginBottom:'1px'}}>{CAT[c]?.icon}</span>{c}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:'10px'}}>
              <label style={lbl}>Date</label>
              <input type="date" value={formDate} onChange={e=>setFormDate(e.target.value)} style={{...inp,width:'100%'}}/>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',background:'rgba(30,41,59,.5)',border:`1.5px solid ${recurring?'rgba(99,102,241,.5)':'rgba(255,255,255,.07)'}`,borderRadius:'10px',cursor:'pointer',marginBottom:'12px'}}>
              <input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)} style={{width:'14px',height:'14px',accentColor:'#6366f1'}}/>
              <span style={{fontSize:'12px',color:'#94a3b8',fontWeight:'500'}}>🔁 Recurring</span>
            </label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 38px',gap:'7px'}}>
              <button onClick={addEntry} style={{...primaryBtn,padding:'10px',justifyContent:'center',display:'flex',fontSize:'13px'}}>Add Entry</button>
              <button onClick={clearAll} style={{padding:'10px',border:'1.5px solid rgba(239,68,68,.3)',borderRadius:'10px',background:'rgba(239,68,68,.08)',color:'#ef4444',fontSize:'14px'}}>🗑</button>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {/* BREAKDOWN */}
            <div style={card}>
              <div style={secTitle}>Spending Breakdown</div>
              <div style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:'18px',alignItems:'center'}}>
                <div style={{position:'relative',width:'160px',height:'160px'}}>
                  {spent?(
                    <>
                      <svg viewBox="0 0 180 180" style={{width:'160px',height:'160px',transform:'rotate(-90deg)'}}>{donutSegs()}</svg>
                      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                        <div style={{fontSize:'14px',fontWeight:'900',color:'#f1f5f9'}}>PKR {Math.round(spent/1000)}k</div>
                        <div style={{fontSize:'9px',color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',marginTop:'2px'}}>Spent</div>
                      </div>
                    </>
                  ):(
                    <div style={{width:'160px',height:'160px',borderRadius:'50%',border:'18px solid rgba(30,41,59,.8)',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b',fontSize:'11px'}}>No data</div>
                  )}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cat,amt])=>{
                    const pct=spent?Math.round((amt/spent)*100):0;
                    const m=CAT[cat]||CAT.Other;
                    return(
                      <div key={cat}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'3px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                            <div style={{width:'22px',height:'22px',borderRadius:'6px',background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px'}}>{m.icon}</div>
                            <span style={{fontSize:'11px',fontWeight:'600',color:'#94a3b8'}}>{cat}</span>
                            <span style={{fontSize:'10px',color:'#64748b'}}>{pct}%</span>
                          </div>
                          <span style={{fontSize:'11px',fontWeight:'700',color:'#f1f5f9'}}>{fmt(amt)}</span>
                        </div>
                        <div style={{height:'3px',background:'rgba(30,41,59,.8)',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',background:m.color,width:`${pct}%`,borderRadius:'3px',transition:'width .8s'}}/>
                        </div>
                      </div>
                    );
                  })}
                  {!Object.keys(catTotals).length&&<span style={{fontSize:'12px',color:'#64748b'}}>No expenses this month</span>}
                </div>
              </div>
            </div>

            {/* 6-MONTH */}
            <div style={card}>
              <div style={secTitle}>Last 6 Months</div>
              <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'5px',height:'100px',paddingTop:'10px'}}>
                {months6.map((m,i)=>(
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',flex:1}}>
                    <span style={{fontSize:'8px',color:'#94a3b8',fontWeight:'600'}}>{m.total>0?`${(m.total/1000).toFixed(1)}k`:''}</span>
                    <div style={{flex:1,width:'100%',display:'flex',alignItems:'flex-end'}}>
                      <div style={{width:'100%',borderRadius:'3px 3px 0 0',minHeight:'3px',height:`${Math.max((m.total/maxM)*100,3)}%`,background:'linear-gradient(180deg,#3b82f6,#8b5cf6)',opacity:m.key===curKey?1:m.key===viewKey?.85:.55,boxShadow:m.key===curKey?'0 0 12px rgba(59,130,246,.5)':m.key===viewKey?'0 0 8px rgba(139,92,246,.5)':'none',transition:'height .8s'}}/>
                    </div>
                    <span style={{fontSize:'8px',color:'#64748b',fontWeight:'600',textTransform:'uppercase'}}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TABS */}
            <div style={card}>
              <div style={{display:'flex',gap:'5px',marginBottom:'14px',flexWrap:'wrap'}}>
                {[['transactions','📋 Transactions'],['insights','💡 Insights'],['catbudgets','🎯 Cat. Budgets']].map(([id,label])=>(
                  <button key={id} onClick={()=>setActiveTab(id)} style={{padding:'6px 12px',borderRadius:'18px',border:`1px solid ${activeTab===id?'rgba(59,130,246,.4)':'rgba(255,255,255,.07)'}`,background:activeTab===id?'rgba(59,130,246,.15)':'rgba(30,41,59,.7)',color:activeTab===id?'#93c5fd':'#64748b',fontSize:'11px',fontWeight:'700',cursor:'pointer'}}>
                    {label}
                  </button>
                ))}
              </div>

              {activeTab==='transactions'&&(
                <>
                  <div style={{position:'relative',marginBottom:'9px'}}>
                    <span style={{position:'absolute',left:'11px',top:'50%',transform:'translateY(-50%)',color:'#64748b',fontSize:'12px'}}>🔍</span>
                    <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,width:'100%',paddingLeft:'32px'}}/>
                  </div>
                  <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'11px'}}>
                    {['all','expense','income','recurring'].map(f=>(
                      <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?'rgba(59,130,246,.15)':'rgba(30,41,59,.7)',border:`1px solid ${filter===f?'rgba(59,130,246,.4)':'rgba(255,255,255,.07)'}`,color:filter===f?'#93c5fd':'#64748b',fontSize:'10px',fontWeight:'600',padding:'4px 10px',borderRadius:'18px',cursor:'pointer'}}>
                        {f==='recurring'?'🔁 Recurring':f.charAt(0).toUpperCase()+f.slice(1)}
                      </button>
                    ))}
                    <span style={{marginLeft:'auto',fontSize:'10px',color:'#64748b',alignSelf:'center'}}>{filtered.length} entries</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px',maxHeight:'420px',overflowY:'auto',paddingRight:'2px'}}>
                    {!filtered.length?(
                      <div style={{textAlign:'center',padding:'36px',color:'#64748b',fontSize:'13px'}}>
                        <div style={{fontSize:'32px',marginBottom:'10px'}}>📭</div>No transactions found.
                      </div>
                    ):filtered.map(e=>{
                      const m=CAT[e.category]||CAT.Other;
                      const d=new Date(e.date+'T00:00:00');
                      return(
                        <div key={e._id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(30,41,59,.45)',border:`1px solid ${e.recurring?'rgba(99,102,241,.2)':'rgba(255,255,255,.07)'}`,borderRadius:'12px',padding:'10px 12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'9px',minWidth:0}}>
                            <div style={{width:'34px',height:'34px',borderRadius:'9px',background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',flexShrink:0}}>{m.icon}</div>
                            <div style={{minWidth:0}}>
                              <div style={{fontSize:'12px',fontWeight:'700',color:'#f1f5f9',display:'flex',alignItems:'center',gap:'5px',flexWrap:'wrap'}}>
                                {e.name}
                                {e.recurring&&<span style={{fontSize:'9px',background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.25)',color:'#a5b4fc',padding:'2px 5px',borderRadius:'4px',fontWeight:'700'}}>🔁</span>}
                              </div>
                              <div style={{fontSize:'10px',color:'#64748b',marginTop:'1px'}}>{e.category} · {d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                            <div style={{fontSize:'12px',fontWeight:'900',color:e.type==='income'?'#10b981':'#ef4444'}}>{e.type==='income'?'+':'−'}{fmt(e.amount)}</div>
                            <button onClick={()=>openEdit(e)} style={{width:'24px',height:'24px',borderRadius:'6px',background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.15)',color:'#3b82f6',cursor:'pointer',fontSize:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}>✏</button>
                            <button onClick={()=>deleteEntry(e._id)} style={{width:'24px',height:'24px',borderRadius:'6px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.15)',color:'#ef4444',cursor:'pointer',fontSize:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeTab==='insights'&&(
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div style={{background:'rgba(30,41,59,.5)',borderRadius:'12px',padding:'14px'}}>
                    <div style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>vs Last Month</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                      {[
                        {label:'This month',val:fmt(spent),   clr:'#ef4444'},
                        {label:'Last month', val:fmt(prevSpent),clr:'#f1f5f9'},
                        {label:'Change',     val:spentDiffPct!=null?`${spentDiff>=0?'+':''}${spentDiffPct}%`:'—',clr:spentDiff<=0?'#10b981':'#ef4444'},
                      ].map((s,i)=>(
                        <div key={i}>
                          <div style={{fontSize:'10px',color:'#64748b',marginBottom:'4px'}}>{s.label}</div>
                          <div style={{fontSize:'16px',fontWeight:'900',color:s.clr}}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px'}}>By Category</div>
                  {catInsights.map(r=>{
                    const m=CAT[r.cat]||CAT.Other;
                    return(
                      <div key={r.cat} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:'26px',height:'26px',borderRadius:'7px',background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',flexShrink:0}}>{m.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                            <span style={{fontSize:'11px',fontWeight:'600',color:'#94a3b8'}}>{r.cat}</span>
                            <span style={{fontSize:'10px',color:r.diff<=0?'#10b981':'#ef4444',fontWeight:'700'}}>{r.pct!=null?`${r.diff>=0?'+':''}${r.pct}%`:'new'}</span>
                          </div>
                          <div style={{height:'3px',background:'rgba(30,41,59,.8)',borderRadius:'3px',overflow:'hidden'}}>
                            <div style={{height:'100%',background:m.color,width:`${spent?Math.round((r.cur/spent)*100):0}%`,borderRadius:'3px'}}/>
                          </div>
                          <div style={{fontSize:'9px',color:'#64748b',marginTop:'2px'}}>{fmt(r.cur)} this · {fmt(r.prev)} last</div>
                        </div>
                      </div>
                    );
                  })}
                  {!catInsights.length&&<div style={{textAlign:'center',padding:'24px',color:'#64748b',fontSize:'12px'}}>No data to compare yet.</div>}
                </div>
              )}

              {activeTab==='catbudgets'&&(
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  <p style={{fontSize:'11px',color:'#64748b',marginBottom:'4px'}}>Set a spending limit per category. Bar turns red when exceeded.</p>
                  {EXP_CATS.map(cat=>{
                    const spentC=catTotals[cat]||0;
                    const catBud=catBudgets[cat]||0;
                    const pct=catBud>0?Math.min((spentC/catBud)*100,100):0;
                    const over=catBud>0&&spentC>catBud;
                    const m=CAT[cat];
                    return(
                      <div key={cat} style={{background:'rgba(30,41,59,.5)',borderRadius:'12px',padding:'12px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'7px',flexWrap:'wrap',gap:'6px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                            <span style={{fontSize:'16px'}}>{m.icon}</span>
                            <span style={{fontSize:'12px',fontWeight:'700',color:'#f1f5f9'}}>{cat}</span>
                            {over&&<span style={{fontSize:'9px',background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',padding:'2px 5px',borderRadius:'4px',fontWeight:'700'}}>OVER</span>}
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                            <span style={{fontSize:'10px',color:'#64748b'}}>{fmt(spentC)} / </span>
                            <input type="number" placeholder="No limit" defaultValue={catBud||''} onBlur={e=>saveCatBudget(cat,e.target.value)} style={{width:'80px',background:'rgba(6,12,24,.7)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',color:'#f1f5f9',fontSize:'10px',padding:'3px 7px',outline:'none',fontFamily:'inherit'}}/>
                          </div>
                        </div>
                        {catBud>0&&(
                          <div style={{height:'4px',background:'rgba(30,41,59,.8)',borderRadius:'3px',overflow:'hidden'}}>
                            <div style={{height:'100%',background:over?'#ef4444':m.color,width:`${pct}%`,borderRadius:'3px',transition:'width .8s'}}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const card      = {background:'rgba(13,20,38,.92)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'18px',padding:'18px',backdropFilter:'blur(20px)'};
const secTitle  = {fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'14px'};
const primaryBtn= {background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',border:'none',padding:'10px 16px',borderRadius:'10px',fontWeight:'700',fontSize:'13px',cursor:'pointer',boxShadow:'0 4px 14px rgba(59,130,246,.35)'};
const ghostBtn  = {background:'rgba(30,41,59,.7)',border:'1px solid rgba(255,255,255,.07)',color:'#94a3b8',fontSize:'12px',fontWeight:'600',padding:'10px 13px',borderRadius:'10px',cursor:'pointer'};
const navBtn    = {background:'rgba(30,41,59,.8)',border:'1px solid rgba(255,255,255,.07)',color:'#94a3b8',width:'24px',height:'24px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',display:'flex',alignItems:'center',justifyContent:'center'};
const lbl       = {fontSize:'10px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',display:'block',marginBottom:'4px'};
const inp       = {background:'rgba(30,41,59,.7)',border:'1.5px solid rgba(255,255,255,.07)',borderRadius:'9px',color:'#f1f5f9',fontSize:'13px',padding:'8px 11px',outline:'none',fontFamily:'inherit'};
