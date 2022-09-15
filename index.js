const screenshot = require('screenshot-desktop');
var Jimp = require('jimp');

const Net = require('net');
const server = new Net.Server();
const port = 1337;


server.listen(port, () => {
    console.log(`server running port: ${port}`);
});

server.on('connection', (socket) => {
    console.log('A new connection has been established.');

    socket.on('data', async (chunk) => {
        console.log(new Date(), chunk);

        if(chunk[0] == 1){

            var img = await screenshot();
            var test = await Jimp.read(img);
            var rescaled = test.resize(256, 192);
        
            var imageBuffer = new Uint16Array(256*192);

            for(var i = 0; i < rescaled.bitmap.data.length; i += 4){
                var r = rescaled.bitmap.data[i] / 8;
                var g = rescaled.bitmap.data[i + 1] / 8;
                var b = rescaled.bitmap.data[i + 2] / 8;
                var a = rescaled.bitmap.data[i + 3] ? 1 : 0;
        
                var color = (((a) << 15) | (r)|((g)<<5)|((b)<<10));
        
                imageBuffer[i / 4] = color;
            }

            var data_8 = new Uint8Array(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength);
            socket.write(data_8);
        }
    });
});