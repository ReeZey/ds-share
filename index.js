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
            console.time("convert");
            console.time("screenshot");
            var img = await screenshot();
            console.timeEnd("screenshot");
            console.time("read");
            var test = await Jimp.read(img);
            console.timeEnd("read");
            console.time("resize");
            var rescaled = test.resize(256, 192);
            console.timeEnd("resize");
        
            console.time("color fix");
            var imageBuffer = new Uint16Array(256*192);
            for(var i = 0; i < rescaled.bitmap.data.length; i += 4){
                imageBuffer[i >> 2] = (((rescaled.bitmap.data[i + 3] ? 1 : 0) << 15) | (rescaled.bitmap.data[i] >> 3) |((rescaled.bitmap.data[i + 1] >> 3)<<5)|((rescaled.bitmap.data[i + 2] >> 3)<<10));
            }
            console.timeEnd("color fix");

            var data_8 = new Uint8Array(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength);
            console.timeEnd("convert");
            socket.write(data_8);
        }
    });
});