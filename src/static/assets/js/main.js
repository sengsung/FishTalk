try {
  var socket = io.connect();
} catch (err) {
  console.log(err)
  console.log('소켓연결실패');
}

socket.on('connect_ok', data => {
  document.getElementById('chat_title').textContent = title;
  document.getElementById('main_chat').style.display = '';
  document.getElementById('main').style.display = 'none';

  socket.emit('chat_list')
});

socket.on('chat_notice', data => {
  chatNotice(data);
});

socket.on('chat_new', data => {
  data.user == name ? chatAddMe(data) : chatAddOther(data);
});

var user_list;
socket.on('chat_list', data => {
  user_list = data.list
  updateUserList();
});

socket.on('new', data => {
  if (!user_list) {
    socket.emit('chat_list');
    return;
  }
  user_list.push(data.user)
  updateUserList();
});

socket.on('leave', data => {
  if (!user_list) {
    socket.emit('chat_list');
    return;
  }
  for (let i in user_list) {
    if (user_list[i] == data.user) {
      user_list.splice(i, 1);
      break;
    }
  }
  updateUserList();
})

socket.on('err', data => {
  alert(data.msg);
})

function chatAddOther(data) {
  var html = `
    <div class="item_other">
      <div class="item_other_wrap">
          <img src="assets/img/profile.png">
          <div class="box">
              <div class="name">${data.user}</div>
              <div class="chat_other">${data.msg}</div>
          </div>
          <span class="time">${getTime()}</span>
      </div>
    </div>
    `;
  var obj = document.getElementById('chat_body');
  obj.innerHTML += html;
  obj.scrollTop = obj.scrollHeight;
}

function chatAddMe(data) {
  var html = `
    <div class="item_me">
      <div class="item_me_wrap">
        <span class="time">${getTime()}</span>
        <div class="chat_me">${data.msg}</div>
      </div>
    </div>
  `
  var obj = document.getElementById('chat_body');
  obj.innerHTML += html;
  obj.scrollTop = obj.scrollHeight;
}

function chatNotice(data) {
  var html = `
    <div class="item_notice">
          ${data.msg}
    </div>
  `
  var obj = document.getElementById('chat_body');
  obj.innerHTML += html;
  obj.scrollTop = obj.scrollHeight;
}

function updateUserList() {
  var obj = document.getElementById('box_joinner');
  obj.innerHTML = '';
  for (let i in user_list) {
    let html = `<div class="joinner">${user_list[i]}</div>`
    obj.innerHTML += html;
  }
}

function getTime() {
  var date = new Date();
  var str = '';
  str += date.getHours() >= 12 ? '오후 ' : '오전 ';
  
  var time = date.getHours();
  if (time > 13) time -= 12;
  if (time < 10) time = '0' + time;
  str += time + ':';

  var min = date.getMinutes();
  if (min < 10) min = '0' + min;
  str += min;

  return str;
}

function send_chat() {
  var msg = document.getElementById('textarea_chat').value;
  document.getElementById('textarea_chat').value = '';
  socket.emit('chat', { msg: msg });
}

function keyEvent(event) {
  if (event.keyCode === 13) {
    send_chat();
    event.preventDefault();
   }
}

var title;
var name;
function connect() {
  name = document.getElementById('input_name').value;
  title = document.getElementById('input_title').value;
  var pwd = document.getElementById('input_pwd').value;

  socket.emit('chat_connect', { title: title, name: name, pwd: pwd });
}

function leave() {
  socket.emit('chat_leave');

  document.getElementById('main').style.display = '';
  document.getElementById('main_chat').style.display = 'none';
}