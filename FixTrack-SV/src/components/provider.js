'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
const Context = createContext(null);
export async function api(path, method = 'GET', body) {
  const response = await fetch(`/api/${path}`, { method, credentials: 'same-origin', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Error de conexión.'); return data;
}
export function Provider({ children }) {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  const refresh = useCallback(async () => { try { setData(await api('data')); setError(''); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { const timer = setTimeout(refresh, 0); const poll = setInterval(refresh, 30000); return () => { clearTimeout(timer); clearInterval(poll); }; }, [refresh]);
  const save = async (resource, values, id, method) => { const result = await api(`${resource}${id ? `/${id}` : ''}`, method || (id ? 'PATCH' : 'POST'), values); await refresh(); return result; };
  return <Context.Provider value={{ data, error, refresh, save }}>{children}</Context.Provider>;
}
export const useData = () => useContext(Context);
