"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
export default function VerifyPaymentPage(){
 const [message,setMessage]=useState("Verifying your payment securely…");
 useEffect(()=>{const reference=new URLSearchParams(location.search).get("reference");if(!reference){setMessage("No payment reference was provided.");return;}fetch("/api/fees/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference})}).then(async r=>{const d=await r.json();setMessage(r.ok&&d.verified?"Payment confirmed. The school fee record has been updated.":d.error||"Payment is not yet confirmed. Please check again shortly.");}).catch(()=>setMessage("We could not verify this payment right now."));},[]);
 return <main className="grid min-h-screen place-items-center bg-[#f6f8fb] p-5"><div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-soft"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf4fb] text-2xl text-[#176ba8]">✓</div><h1 className="mt-5 text-xl font-extrabold">Payment verification</h1><p className="mt-3 text-sm text-slate-500">{message}</p><Link href="/fees" className="mt-6 inline-block rounded-xl bg-[#176ba8] px-5 py-3 text-xs font-bold text-white">Return to school fees</Link></div></main>;
}
