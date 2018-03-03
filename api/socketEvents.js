exports = module.exports = function(io) {
  io.on('connection', function(socket) {
    console.log('a user connected')
    // socket.join('Lobby');
    socket.on('app mounted', function(user) {
      // TODO: Does the server need to know the user?
      console.log('app mounted: ' + JSON.stringify(user))
      socket.emit('receive socket', socket.id)
    })
    socket.on('test', function(user) {
      console.log('test heard')
    })
    // socket.on('join channel', function(channel) {
    //   socket.join(channel.name)
    // })
    // socket.on('new message', function(msg) {
    //   socket.broadcast.to(msg.channelID).emit('new bc message', msg);
    // });
    // socket.on('new channel', function(channel) {
    //   socket.broadcast.emit('new channel', channel)
    // });
    // socket.on('typing', function (data) {
    //   socket.broadcast.to(data.channel).emit('typing bc', data.user);
    // });
    // socket.on('stop typing', function (data) {
    //   socket.broadcast.to(data.channel).emit('stop typing bc', data.user);
    // });
    // socket.on('new private channel', function(socketID, channel) {
    //   socket.broadcast.to(socketID).emit('receive private channel', channel);
    // })
  });
  io.on('test', function(user) {
    console.log('socket test fired')
  })
}
