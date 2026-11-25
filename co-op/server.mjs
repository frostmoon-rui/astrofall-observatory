import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {WebSocketServer, WebSocket} from 'ws';
import {createArena, MAX_PLAYERS, TICK} from './arena.mjs';

const files = new Map(Object.entries({
  '/': ['index.html','text/html; charset=utf-8'],
  '/co-op/': ['co-op/index.html','text/html; charset=utf-8'],
  '/co-op/client.mjs': ['co-op/client.mjs','text/javascript; charset=utf-8'],
  '/co-op/motion.mjs': ['co-op/motion.mjs','text/javascript; charset=utf-8'],
  '/co-op/arena.mjs': ['co-op/arena.mjs','text/javascript; charset=utf-8'],
  '/co-op/style.css': ['co-op/style.css','text/css; charset=utf-8'],
  '/assets/exploration/game.css': ['assets/exploration/game.css','text/css; charset=utf-8'],
  '/assets/exploration/game.js': ['assets/exploration/game.js','text/javascript; charset=utf-8'],
  '/assets/exploration/world.js': ['assets/exploration/world.js','text/javascript; charset=utf-8'],
  '/assets/exploration/labels.js': ['assets/exploration/labels.js','text/javascript; charset=utf-8'],
  '/manifest.webmanifest': ['manifest.webmanifest','application/manifest+json'],
  '/sw.js': ['sw.js','text/javascript; charset=utf-8'],
  ...Object.fromEntries(['favicon-32','apple-touch-icon','icon-192','icon-512'].map(name =>
    ['/assets/icons/'+name+'.png',['assets/icons/'+name+'.png','image/png']])),
}));
const root = new URL('../',import.meta.url);

export function createGameServer() {
  const rooms = new Map();
  const sockets = new WebSocketServer({noServer:true,maxPayload:256,perMessageDeflate:false});
  const http = createServer(async (request,response) => {
    const pathname = request.url?.split('?')[0];
    const asset = files.get(pathname);
    if (!asset || !['GET','HEAD'].includes(request.method)) {
      response.writeHead(asset ? 405 : 404).end();
      return;
    }
    try {
      const body=await readFile(new URL(asset[0],root));
      response.writeHead(200,{'Content-Type':asset[1],'X-Content-Type-Options':'nosniff',
        'Cache-Control':'no-cache','Referrer-Policy':'no-referrer'}).end(request.method==='HEAD'?undefined:body);
    } catch {
      response.writeHead(500).end();
    }
  });
  http.on('upgrade',(request,socket,head) => {
    const target = /^\/co-op\/socket\/(relay|runner)\/([a-z0-9-]{3,24})$/.exec(request.url || '');
    const origin = request.headers.origin;
    if (!target || (origin && origin !== 'https://'+request.headers.host && origin !== 'http://'+request.headers.host)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    const [,mode,code] = target;
    const key = mode+'/'+code;
    let room=rooms.get(key);
    if ((!room && rooms.size>=40) || room?.arena.size>=MAX_PLAYERS) {
      socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');
      return;
    }
    if (!room) {
      room={arena:createArena(mode),peers:new Set()};
      rooms.set(key,room);
    }
    sockets.handleUpgrade(request,socket,head,ws => {
      const id=randomUUID();
      if (!room.arena.join(id)) {ws.close(1013);return;}
      room.peers.add(ws);
      ws.alive=true;
      ws.on('pong',()=>{ws.alive=true;});
      ws.on('error',()=>ws.terminate());
      ws.send(JSON.stringify({type:'welcome',id}));
      let windowUntil=0, count=0;
      ws.on('message', (raw,isBinary) => {
        const now=Date.now();
        if (now>=windowUntil) {windowUntil=now+1000;count=0;}
        if (++count>40) {ws.close(1008);return;}
        if (isBinary) return;
        let state;
        try {state=JSON.parse(raw.toString());} catch {return;}
        if (state && typeof state === 'object') room.arena.input(id,state);
      });
      ws.on('close',()=>{
        room.arena.leave(id);
        room.peers.delete(ws);
        if (!room.peers.size) rooms.delete(key);
      });
    });
  });
  let frame=0;
  const heartbeat=setInterval(()=>{
    for (const ws of sockets.clients) {
      if (!ws.alive) ws.terminate();
      else {ws.alive=false;ws.ping();}
    }
  },15000);
  const timer=setInterval(()=>{
    frame++;
    for (const {arena,peers} of rooms.values()) {
      arena.step(TICK);
      if (frame%2) continue;
      const payload=JSON.stringify(arena.snapshot());
      for (const ws of peers) if (ws.readyState===WebSocket.OPEN && ws.bufferedAmount<32768) ws.send(payload);
    }
  },1000*TICK);
  http.on('close',()=>{clearInterval(timer);clearInterval(heartbeat);sockets.close();});
  return http;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port=Number(process.env.PORT || 8789);
  createGameServer().listen(port,process.env.GAME_HOST || '127.0.0.1',
    ()=>console.log('Observatory playtest listening on port '+port));
}
