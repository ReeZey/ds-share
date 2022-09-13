const Net = require('net');
const server = new Net.Server();
const port = 1337;

var Jimp = require('jimp');

var imageBuffer = new Uint16Array(256*192);

Jimp.read('image2.png', (err, img) => {
    if (err) throw err;
    //#define ARGB16(a,r,g,b) ( ((a) << 15) | (r)|((g)<<5)|((b)<<10))

    for(var i = 0; i < img.bitmap.data.length; i += 4){
        var r = img.bitmap.data[i];
        var g = img.bitmap.data[i + 1];
        var b = img.bitmap.data[i + 2];
        var a = img.bitmap.data[i + 3] ? 1 : 0;

        var color = (((a) << 15) | (r)|((g)<<5)|((b)<<10));

        imageBuffer[i / 4] = color;
    }
});

server.listen(port, () => {
    console.log(`Server listening for connection requests on socket localhost:${port}`);
});

server.on('connection', (socket) => {
    console.log('A new connection has been established.');
	
    var data_8 = new Uint8Array(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength)
    

    socket.write(data_8);
    
    console.log(socket);

    socket.on('data', (chunk) => {
        console.log(chunk);
    });

    socket.on('end', () => {
        console.log('Closing connection with the client');
    });
	
    socket.on('error', (err) => {
        console.log(`Error: ${err}`);
    });
});