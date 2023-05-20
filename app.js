const express= require('express');
const path= require('path');
const http= require('http');
const socketio=require('socket.io');
const formatMessage=require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require('./utils/users');

const app=express();
const server=http.createServer(app);
const io=socketio(server);

//set static folder
app.use(express.static(path.join(__dirname,'public')));
const bot='ChatApp Bot';
//Run when a client connect
io.on('connection',socket=>{
    socket.on('joinRoom',({username,room})=>{
        const user= userJoin(socket.id,username,room);
        socket.join(user.room);
        //To welcome when client who is connecting
        socket.emit('message',formatMessage(bot,'Welcome to Chat App'));
        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(bot,`${user.username} has joined the chat`));
        //send users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });
    })

    //Listen for chat message
    socket.on('chatMessage',(msg)=>{
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    //when user disconnect
    socket.on('disconnect',()=>{
        const user=userLeave(socket.id);
        if(user){
            io.emit('message',formatMessage(bot,`${user.username} has left the chat`));

            //send users and room info
            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            });
        }
    });
})

const PORT=3000 || process.env.PORT;

server.listen(PORT,()=> console.log(`Server is running on port ${PORT}`));