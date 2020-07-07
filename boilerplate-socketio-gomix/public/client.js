$( document ).ready(function() {
  
  /*global io*/
var socket = io(); //challenge 17
   
  
  socket.on('user count', function(data){ //challenge 18 conteo de usuarios
  console.log(data);
});
  
   //challenge 21: Announce New Users
  socket.on('user', function(data){
    $('#num-users').text(data.currentUsers+' users online');
    var message = data.name;
    if(data.connected) {
      message += ' has joined the chat.';
    } else {
      message += ' has left the chat.';
    }
    $('#messages').append($('<li>').html('<b>'+ message +'<\/b>'));
  });
  
  socket.on('chat message', function(data){
    console.log(data);
    $('#messages').append($('<li>').text(data.name + ': ' +data.message));
  });
  
  
  // Form submittion with new message in field with id 'm'
  $('form').submit(function(){
    var messageToSend = $('#m').val();
    //send message to server here?
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
  
  
  
});
