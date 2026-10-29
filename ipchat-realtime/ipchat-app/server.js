import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
const app=express();const server=createServer(app);const io=new Server(server);const rooms=new Map();
app.use(express.static('public'));
function members(room){return [...(rooms.get(room)?.values()||[])].map(x=>({id:x.id,name:x.name}));}
function update(room){io.to(room).emit('members',members(room));}
io.on('connection',socket=>{
 socket.on('join',({name,room},ack)=>{name=String(name||'').trim().slice(0,24);room=String(room||'').trim().slice(0,32);if(!name||!room||!/^[a-zA-Z0-9_-]+$/.test(room))return ack?.({error:'Enter a username and valid room code.'});socket.data={name,room};socket.join(room);if(!rooms.has(room))rooms.set(room,new Map());rooms.get(room).set(socket.id,{id:socket.id,name});ack?.({ok:true});update(room);});
 socket.on('message',(value)=>{const {name,room}=socket.data||{};if(!room)return;const text=String(value||'').trim().slice(0,2000);if(text)io.to(room).emit('message',{id:socket.id,name,text,time:Date.now()});});
 socket.on('typing',value=>{const {name,room}=socket.data||{};if(room)socket.to(room).emit('typing',{id:socket.id,name,typing:!!value});});
 socket.on('disconnect',()=>{const {room}=socket.data||{};if(!room)return;rooms.get(room)?.delete(socket.id);if(!rooms.get(room)?.size)rooms.delete(room);else update(room);});
});
server.listen(process.env.PORT||3000,()=>console.log('IPCHAT running on http://localhost:'+(process.env.PORT||3000)));
