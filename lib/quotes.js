export function bestUserQuote(uber,lyft){
 const rows=[['Uber',uber],['Lyft',lyft]].filter(([,v])=>String(v).trim()!==''&&Number.isFinite(Number(v))&&Number(v)>0).map(([provider,value])=>({provider,amount:Number(value),source:'user-entered round-trip quote'}));
 return rows.sort((a,b)=>a.amount-b.amount)[0]||null;
}
