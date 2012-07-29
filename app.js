var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

// we're using herokus PORT or 8888 locally
app.listen(process.env.PORT || 8888);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

function escapeHTML(string) {
  return replaceURLWithHTMLLinks(string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
}

function highlight(searchFor, string) {
  if(string.indexOf(searchFor) >= 0) {
    string = '<span class="highlight">' + string + '</span>';
  }
  return string;
}

function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp,"<a href='$1'>$1</a>"); 
}

var users = new Array();

var chat = io.of('/chat').on('connection', function (socket) {
  socket.on('login', function (data) {
    console.log('User ' + data['username'] + ' joined');
    socket.set('username', data['username'], function() {
      socket.broadcast.emit('msg', {source: data['username'], msg: 'User joined'});
      users.push(data['username']);
    });
    socket.emit('ready', {users: users})
  });
  socket.on('disconnect', function() {
    socket.get('username', function(err, username) {
      for(i in users) {
        if(users[i] == username) {
          users.splice(i, 1);
        }
      }
      console.log('User ' + username + ' left');
      socket.broadcast.emit('msg', {source: username, msg: 'User left'});
    });
  });

  socket.on('msg', function(data) {
    socket.get('username', function(err, username) {
      socket.broadcast.emit('msg', {source: username, msg: escapeHTML(data['msg'])});
      socket.emit('msg', {source: 'You', msg: escapeHTML(data['msg'])});
    });
  });
});

