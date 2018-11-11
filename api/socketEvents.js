exports = module.exports = function(io) {
  io.on('connection', function(client) {
    console.log('a user connected')
    console.dir(client.id)
    // socket.join('Lobby');
    client.on('app mounted', function(user) {
      // TODO: Does the server need to know the user?
      console.log('app mounted: ' + JSON.stringify(user))
      client.emit('receive socket', client.id)
    })
    client.on("JOIN_ME", function(me) {
      console.log("JOIN_ME joining... " + me)
      client.join(me) // user_id
      console.dir(client.rooms)
    })
    client.on("LEAVE_ME", function(me) {
      console.log("LEAVE_ME leaving..." + me )
      client.leave(me)
    })
    client.on("JOIN_ADMIN", function(room) {
      console.log("JOIN_ADMIN joining..." )
      client.join(room)
    })
    client.on("LEAVE_ADMIN", function(room) {
      console.log("LEAVE_ADMIN leaving..." )
      client.leave(room)
    })
    client.on("disconnect", function(room) {
      console.log("disconnected..." )
      client.removeAllListeners(["ME_UPDATED"])
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
