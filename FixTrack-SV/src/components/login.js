'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from './provider';
export default function Login({ first }) { const router = useRouter();
  const [register, setRegister] = useState(first); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try { const result = await api(`auth/${register ? 'register' : 'login'}`, 'POST', Object.fromEntries(new FormData(event.currentTarget)));
      if (result.pending) { setSuccess('Cuenta registrada. El administrador debe activarla antes de que puedas ingresar.'); setRegister(false); }
      else { router.push('/panel'); router.refresh(); }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="login"><section className="login-story"><Link className="brand" href="/">▣ <span>FixTrack<span className="brand-sv">SV</span></span></Link><div><p className="eyebrow">EL ORDEN DETRÁS DE CADA REPARACIÓN</p><h1>Tu taller.<br/>Todo bajo control.</h1><p>Del primer diagnóstico a la última entrega. Una sola plataforma para cuidar cada equipo y cada cliente.</p><div className="login-chips"><span>01 · Recibí</span><span>02 · Repará</span><span>03 · Entregá</span></div></div><small>Gestión de servicios técnicos · El Salvador</small></section><section className="login-form"><div className="login-card"><span className="pill">CENTRO DE OPERACIONES</span><h2>{first ? 'Prepará tu taller' : register ? 'Creá tu cuenta' : 'Bienvenido de nuevo'}</h2><p className="muted">{first ? 'La primera cuenta será la administradora del sistema.' : register ? 'Tu cuenta quedará pendiente de aprobación administrativa.' : 'Ingresá a tu espacio de trabajo.'}</p><form onSubmit={submit}>{register && <label>Nombre completo<input name="name" required minLength={2} maxLength={100} autoComplete="name"/></label>}<label>Correo electrónico<input name="email" type="email" required maxLength={150} autoComplete="email"/></label><label>Contraseña<input name="password" type="password" required minLength={register ? 10 : 1} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'}/>{register && <small>Mínimo 10 caracteres.</small>}</label>{error && <p role="alert" className="alert error">{error}</p>}{success && <p role="status" className="alert success">{success}</p>}<button disabled={busy} className="primary wide">{busy ? 'Procesando…' : register ? 'Crear cuenta' : 'Ingresar al taller →'}</button></form>{!first && <button className="link wide" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Ya tengo una cuenta' : 'Solicitar una cuenta'}</button>}<p className="login-foot">Acceso para administradores, recepción y técnicos.</p></div></section></main>;
}

