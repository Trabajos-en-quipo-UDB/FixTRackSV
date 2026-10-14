export function createApi(base,token,onUnauthorized=()=>{}) {
  return async function request(path,method='GET',body) {
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
    try {
      const response=await fetch(`${base}/api/${path}`,{method,signal:controller.signal,headers:{'Content-Type':'application/json','X-FixTrack-Client':'mobile',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
      const raw=await response.text();let result;
      try{result=JSON.parse(raw);}catch{throw new Error('El servidor no devolvió JSON. Revisá la dirección y ejecutá el backend actualizado.');}
      if(response.status===401&&token)await onUnauthorized();
      if(!response.ok)throw new Error(result.error||`Error ${response.status}`);
      return result;
    } catch(error) {
      if(error.name==='AbortError')throw new Error('El servidor tardó demasiado. Revisá la conexión y volvé a intentar.');
      if(/Network request failed|fetch failed/.test(error.message))throw new Error('No hay conexión con el servidor. Revisá Wi-Fi, dirección y puerto.');
      throw error;
    } finally {clearTimeout(timer);}
  };
}
