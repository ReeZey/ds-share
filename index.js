const Net = require('net');
const server = new Net.Server();
const port = 1337;


server.listen(port, () => {
    console.log(`Server listening for connection requests on socket localhost:${port}`);
});

server.on('connection', (socket) => {
    console.log('A new connection has been established.');
	
    socket.on('data', (chunk) => {
        console.log(`Data received from client: ${chunk.toString()}`);
		socket.write('Hello, client.\n\0');
    });
	
    socket.on('end', () => {
        console.log('Closing connection with the client');
    });
	
    socket.on('error', (err) => {
        console.log(`Error: ${err}`);
    });
});