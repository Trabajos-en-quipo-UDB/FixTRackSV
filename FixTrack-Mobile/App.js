import React,{useEffect,useState} from 'react';
import {View,Text,Pressable,ActivityIndicator,BackHandler,StatusBar} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {AppProvider,useApp} from './src/context';
import {s,Button,ErrorBox,Page} from './src/ui';
import {Login,Home,Orders,Catalog,Editor,Detail,Movement,More,EquipmentHistory} from './src/screens';
function Navigation(){const {session,data,boot,error,refresh,logout,refreshing}=useApp();const [stack,setStack]=useState([{name:'home'}]);const screen=stack[stack.length-1];const go=(name,params={})=>setStack(v=>[...v,{name,...params}]);const back=()=>setStack(v=>v.length>1?v.slice(0,-1):v);
 useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(stack.length>1){back();return true;}return false;});return()=>sub.remove();},[stack.length]);
 useEffect(()=>{setStack([{name:'home'}]);},[session?.token]);
 if(boot)return <View style={[s.root,{justifyContent:'center'}]}><ActivityIndicator color="#173b35" size="large"/></View>;
 if(!session)return <Login/>;
 if(!data)return <Page><Text style={s.title}>Conectando tu taller</Text><ErrorBox message={error}/>{refreshing&&<ActivityIndicator color="#173b35"/>}<Button title="Reintentar conexión" onPress={refresh}/><Button secondary title="Volver al acceso" onPress={logout}/></Page>;
 let content;
 switch(screen.name){case 'home':content=<Home go={go}/>;break;case 'orders':content=<Orders go={go}/>;break;case 'clients':case 'equipment':case 'parts':case 'users':content=screen.name==='users'&&data.user.role!=='Administrador'?<More go={go}/>:<Catalog key={screen.name} resource={screen.name} go={go}/>;break;case 'edit':content=<Editor key={`${screen.resource}-${screen.id}`} {...screen} back={back}/>;break;case 'detail':content=<Detail key={screen.id} id={screen.id} go={go}/>;break;case 'movement':content=<Movement {...screen} back={back}/>;break;case 'equipmentHistory':content=<EquipmentHistory id={screen.id} go={go}/>;break;default:content=<More go={go}/>;}
 return <View style={s.root}><View style={[s.header,s.row]}>{stack.length>1?<Pressable accessibilityRole="button" onPress={back}><Text style={s.back}>← Volver</Text></Pressable>:<Text style={[s.heading,{marginBottom:0}]}>▣ FixTrack <Text style={{fontSize:12}}>SV</Text></Text>}<Text style={s.muted}>{data.user.role}</Text></View>{!!error&&<View style={{paddingHorizontal:20}}><ErrorBox message={error}/></View>}{content}<View style={s.tabbar}>{[['home','◫','Inicio'],['orders','▤','Órdenes'],['clients','♧','Clientes'],['more','◎','Más']].map(([name,icon,label])=><Pressable key={name} accessibilityRole="tab" accessibilityState={{selected:screen.name===name}} onPress={()=>setStack([{name}])} style={[s.tab,screen.name===name&&{backgroundColor:'#e8f0de'}]}><Text style={s.tabIcon}>{icon}</Text><Text style={s.tabText}>{label}</Text></Pressable>)}</View></View>;
}
export default function App(){return <SafeAreaProvider><SafeAreaView style={s.root}><StatusBar barStyle="dark-content"/><AppProvider><Navigation/></AppProvider></SafeAreaView></SafeAreaProvider>;}
