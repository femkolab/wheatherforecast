"use client";
import { FormEvent, useEffect, useState } from "react";

const cities = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kırıkkale","Kırklareli","Kırşehir","Kilis","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Şanlıurfa","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];
type Row={date:string;max:number;min:number;mean:number;humidity:number};
const iso=(d:Date)=>d.toISOString().slice(0,10);
const endDefault=()=>{const d=new Date();d.setDate(d.getDate()-5);return iso(d)};
const startDefault=()=>{const d=new Date();d.setDate(d.getDate()-5);d.setMonth(d.getMonth()-1);return iso(d)};

async function getHistory(city:string,start:string,end:string){
 const g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr&format=json&countryCode=TR`).then(r=>r.json());
 const p=g.results?.[0]; if(!p) throw Error("Şehir bulunamadı.");
 const q=new URLSearchParams({latitude:p.latitude,longitude:p.longitude,start_date:start,end_date:end,timezone:"Europe/Istanbul",daily:"temperature_2m_max,temperature_2m_min,temperature_2m_mean",hourly:"relative_humidity_2m"});
 const w=await fetch(`https://archive-api.open-meteo.com/v1/archive?${q}`).then(r=>r.json()); if(w.error) throw Error(w.reason||"Veri alınamadı.");
 return w.daily.time.map((date:string,i:number)=>{const hs=w.hourly.relative_humidity_2m.slice(i*24,(i+1)*24).filter((x:number)=>x!=null);return{date,max:Math.round(w.daily.temperature_2m_max[i]),min:Math.round(w.daily.temperature_2m_min[i]),mean:Math.round(w.daily.temperature_2m_mean[i]),humidity:Math.round(hs.reduce((a:number,b:number)=>a+b,0)/hs.length)}}) as Row[];
}
export default function Home(){
 const[city,setCity]=useState("İzmir"),[start,setStart]=useState(startDefault()),[end,setEnd]=useState(endDefault()),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{setRows(await getHistory(city,start,end))}catch(e){setError(e instanceof Error?e.message:"Veri alınamadı.")}finally{setLoading(false)}}
 useEffect(()=>{load()},[]); function submit(e:FormEvent){e.preventDefault();load()}
 const avg=rows.length?Math.round(rows.reduce((a,r)=>a+r.mean,0)/rows.length):0,hum=rows.length?Math.round(rows.reduce((a,r)=>a+r.humidity,0)/rows.length):0;
 return <main><nav><div className="brand">İklim<span>TR</span></div><small>Tarihsel hava arşivi</small></nav><header><p className="eyebrow">TÜRKİYE • GEÇMİŞ HAVA VERİLERİ</p><h1>Şehrin geçmişini<br/><em>havadan oku.</em></h1><p className="intro">Türkiye’nin 81 ili için geçmiş sıcaklık ve nem değerlerini karşılaştırın.</p></header>
 <form onSubmit={submit} className="filters"><label>Şehir<select value={city} onChange={e=>setCity(e.target.value)}>{cities.map(c=><option key={c}>{c}</option>)}</select></label><label>Başlangıç<input type="date" value={start} max={end} onChange={e=>setStart(e.target.value)}/></label><label>Bitiş<input type="date" value={end} min={start} max={endDefault()} onChange={e=>setEnd(e.target.value)}/></label><button disabled={loading}>{loading?"Yükleniyor…":"Verileri getir →"}</button></form>
 {error?<section className="empty">{error}</section>:<><section className="summary"><div><small>SEÇİLİ ŞEHİR</small><strong>{city}</strong><span>{start} — {end}</span></div><div><small>ORT. SICAKLIK</small><strong>{avg}°C</strong><span>Günlük ortalama</span></div><div><small>ORT. NEM</small><strong>%{hum}</strong><span>24 saat ortalaması</span></div><div><small>KAYIT</small><strong>{rows.length}</strong><span>Günlük veri</span></div></section><section className="table-wrap"><table><thead><tr><th>Tarih</th><th>En düşük</th><th>Ortalama</th><th>En yüksek</th><th>Ort. nem</th><th>Nem göstergesi</th></tr></thead><tbody>{rows.map(r=><tr key={r.date}><td>{new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"long",year:"numeric"}).format(new Date(r.date+"T12:00"))}</td><td>{r.min}°C</td><td><b>{r.mean}°C</b></td><td>{r.max}°C</td><td><b>%{r.humidity}</b></td><td><i className="bar"><i style={{width:r.humidity+"%"}}/></i></td></tr>)}</tbody></table></section></>}
 <footer>Veri kaynağı: Open-Meteo Historical Weather API</footer></main>}
