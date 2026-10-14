import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import * as SecureStore from 'expo-secure-store';
import {createApi} from './api';
const Context=createContext(null);const KEY='fixtrack.session.v1';
export function AppProvider({children}) {
  const [session,setSession]=useState(null),[server,setServer]=useState(''),[data,setData]=useState(null),[boot,setBoot]=useState(true),[error,setError]=useState(''),[refreshing,setRefreshing]=useState(false);
  const current=useRef(null);
  async function clear(){current.current=null;setSession(null);setData(null);await SecureStore.deleteItemAsync(KEY);}
  useEffect(()=>{let alive=true;(async()=>{try{const raw=await SecureStore.getItemAsync(KEY);if(raw&&alive){const s=JSON.parse(raw);if(s.base){setServer(s.base);if(s.token){current.current=s;setSession(s);}}}}catch{if(alive)setError('No se pudo recuperar la sesión. Iniciá sesión nuevamente.');}finally{if(alive)setBoot(false);}})();return()=>{alive=false;};},[]);
  async function refresh(){const s=current.current;if(!s)return;setRefreshing(true);try{const result=await createApi(s.base,s.token,async()=>{if(current.current===s)await clear();})('data');if(current.current===s){setData(result);setError('');}}catch(e){if(current.current===s)setError(e.message);}finally{setRefreshing(false);}}
  useEffect(()=>{if(!session)return;refresh();const timer=setInterval(refresh,30000);return()=>clearInterval(timer);},[session]);
  async function authenticate(base,values,register){const result=await createApi(base,null)(`auth/${register?'register':'login'}`,'POST',values);setServer(base);if(result.pending)return result;if(!result.token)throw new Error('Actualizá el backend incluido: falta la sesión móvil.');const s={base,token:result.token};await SecureStore.setItemAsync(KEY,JSON.stringify(s));current.current=s;setData(null);setError('');setSession(s);return result;}
  async function logout(){const s=current.current;let warning='';try{if(s)await createApi(s.base,s.token)('auth/logout','POST',{});}catch{warning='Sesión borrada del teléfono. Sin conexión, la sesión del servidor vencerá en un máximo de 8 horas.';}finally{await clear();setError(warning);}}
  async function save(resource,values,id){const s=current.current;if(!s)throw new Error('La sesión terminó.');const result=await createApi(s.base,s.token,clear)(`${resource}${id?`/${id}`:''}`,id?'PATCH':'POST',values);await refresh();return result;}
  return <Context.Provider value={{session,server,data,boot,error,refreshing,refresh,authenticate,logout,save}}>{children}</Context.Provider>;
}
export const useApp=()=>useContext(Context);
