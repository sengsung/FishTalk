const express = require('express');
const app = express();

app.use(express.static(__dirname + '/static'));

const server_web = require('http').createServer(app);

// ===================== Socket =======================
const io = require('socket.io')(server_web);

var server_list = [];
/*
  {
    title : 생선 심심해서 놀아주는 방
    pwd : 12321
    users : ['생선스프', '스블', '흑염소']
  }
*/
io.on('connection', socket => {
  let room;
  let title;
  let pwd;
  let name;
  socket.on('chat_connect', data => {
    console.log(`${new Date()} ${socket.handshake.address} 접속 시도 : ${data.toString()}`);
    /*
      title
      pwd
      name
    */
    if (room) return socket.emit('err', {msg: '이미 접속된 방이 있습니다' });
    if (!data || !data.title || typeof(data.title) !== typeof('') || !data.name || typeof(data.name) !== typeof('')) return socket.emit('err', { msg: '입력된 데이터가 올바르지 않습니다' });
    if (!data.pwd) data.pwd = '';


    let server_index = -1;
    for (let i in server_list) {
      let server = server_list[i];
      if (server.title == data.title && server.pwd == data.pwd) {
        server_index = i;
        break;
      }
    }

    if (server_index === -1) {
      server_list.push({
        title: data.title,
        pwd: data.pwd,
        users: [`${data.name}`],
      });
    } else {
      let server = server_list[server_index];
      for (let i in server.users) {
        if (server.users[i] == data.name) return socket.emit('err', { msg: '중복되는 이름입니다' });
      }
      server.users.push(data.name);
    }

    room = `title=${data.title}//pwd=${data.pwd}`;
    title = data.title;
    pwd = data.pwd;
    name = data.name;

    socket.join(room);
    socket.emit('connect_ok', { msg: '접속 완료' });
    io.to(room).emit('chat_notice', { msg: `${data.name}님이 접속하셨습니다.`});
    io.to(room).emit('new', { user: name });

    console.log(`${new Date()} ${socket.handshake.address} 새로운 접속 : ${data.toString()}`);
  });

  socket.on('chat_list', data => {
    if (!room) return socket.emit('err', { msg: '접속된 방이 없습니다'});

    for (let i in server_list) {
      let server = server_list[i];
      if (!(server.title == title && server.pwd == pwd)) continue;

      socket.emit('chat_list', { list: server.users });
      break;
    }
    console.log(`${new Date()} ${socket.handshake.address} 채팅 목록 / 방 : ${room}`);
  });

  socket.on('chat', data => {
    if (!data.msg) return socket.emit('err', { msg: '아무런 메시지도 입력하지 않았습니다.' });
    if (!room) return socket.emit('err', { msg: '접속된 방이 없습니다'});
    io.to(room).emit('chat_new', { user: name, msg: data.msg });

    console.log(`${new Date()} ${socket.handshake.address} 채팅 보냄 : ${data.toString()} / 방 : ${room}`);
  });

  socket.on('chat_leave', data => {
    if (!room) return socket.emit('err', { msg: '접속된 방이 없습니다'});

    for (let i in server_list) {
      let server = server_list[i];
      if (!(server.title == title && server.pwd == pwd)) continue;

      for (let j in server.users) {
        if (server.users[j] == name) server.users.splice(j, 1);
      }
      break;
    }
    
    io.to(room).emit('chat_notice', { msg: `${name}님이 떠났습니다.` });
    io.to(room).emit('leave', { user: name });
    
    room = undefined;
    socket.leaveAll();

    console.log(`${new Date()} ${socket.handshake.address} 채팅 떠남 / 방 : ${room}`);
  });

  socket.on('disconnect', data => {
    if (!room) return;

    for (let i in server_list) {
      let server = server_list[i];
      if (!(server.title == title && server.pwd == pwd)) continue;

      for (let j in server.users) {
        if (server.users[j] == name) server.users.splice(j, 1);
      }

      break;
    }
    io.to(room).emit('chat_notice', { msg: `${name}님이 떠났습니다.` });
    io.to(room).emit('leave', { user: name });

    console.log(`${new Date()} ${socket.handshake.address} 연결 끊김 / 방 : ${room}`);
  });
});
// ===================== Socket End =======================
server_web.listen(8000, () => {
  console.log('http server start');
});
