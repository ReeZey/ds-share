import robot from "robotjs";
import sharp from "sharp";
import utils from "util";

import Net from 'net';
const server = new Net.Server();
const port = 1337;

server.listen(port, () => {
    console.log(`server running port: ${port}`);
});

server.on('connection', (socket) => {
    console.log('A new connection has been established.');
    /*
    socket.on('data', async (chunk) => {
        console.log(new Date(), chunk);

        if(chunk[0] == 1){
            SendScreenshot(socket);
        }
    });
    */

    SendScreenshot(socket);
});

var lastSend = new Uint16Array(256*192);

async function SendScreenshot(socket){
    const im = robot.screen.capture(0, 0, 1280, 720);
    const rescaled = await sharp(im.image, { raw: { width: im.width, height: im.height, channels: im.bytesPerPixel } }).resize(256, 192, { fit: "fill" }).raw().toBuffer();

    var imageBuffer = new Uint16Array(256*192);
    for(var i = 0; i < rescaled.length; i += 4){
        imageBuffer[i >> 2] = (((rescaled[i + 3] ? 1 : 0) << 15) | (rescaled[i + 2] >> 3) |((rescaled[i + 1] >> 3)<<5)|((rescaled[i] >> 3)<<10));
    }

    var current = [];
    var output = [];
    var skip = 0;

    for(var i = 0; i < imageBuffer.length; i++){
        if(imageBuffer[i] != lastSend[i]){
            if(skip > 0){
                output.push(0);
                output.push(skip);
                skip = 0;
            }

            current.push(imageBuffer[i]);
        }else{
            if(current.length > 0){
                output.push(1);
                output.push(current.length);
                output = output.concat(current);
    
                current = [];
            }

            skip++;
        }
    }

    if(output.length == 0){
        output.push(1);
        output.push(current.length);
        output = output.concat(current);
    }

    var data_16 = Uint16Array.from(output);
    var data_8 = new Uint8Array(data_16.buffer);

    //console.log(data_16);
    //console.log(data_8);

    var buff = Buffer.alloc(4);
    buff.writeUint32LE(data_8.length);

    socket.write(buff);
    socket.write(data_8, () => {
        console.log("sent");
        lastSend = imageBuffer;

        setTimeout(() => {
            SendScreenshot(socket);
        }, 20);
    });
    

    /*
    deflate(data_8, (err, buffer) => {
        console.log(buffer.length)
    }, {options: constants.Z_NO_COMPRESSION});
    */
}