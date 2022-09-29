import robot from "robotjs";
import sharp from "sharp";
import Net from 'net';
import { deflate, constants } from 'node:zlib';

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

var lastSend = new Uint16Array(256 * 192);
var output2 = new Uint8Array(256 * 192 * 3);

async function SendScreenshot(socket) {

    console.log("--- new img ---")

    console.time("total");

    console.time("screenshot");
    const im = robot.screen.capture(0, 0, 1920, 1080);
    const rescaled = await sharp(im.image, { raw: { width: im.width, height: im.height, channels: im.bytesPerPixel } }).resize(256, 192, { fit: "fill" }).raw().toBuffer();
    console.timeEnd("screenshot");

    console.time("color");
    var imageBuffer = new Uint16Array(256 * 192);
    for (var i = 0; i < rescaled.length; i += 4) {
        imageBuffer[i >> 2] = (((rescaled[i + 3] ? 1 : 0) << 15) | (rescaled[i + 2] >> 3) | ((rescaled[i + 1] >> 3) << 5) | ((rescaled[i] >> 3) << 10));
    }
    console.timeEnd("color");
    
    
    console.time("diff check");
    var current = [];
    var output = [];
    var skip = 0;

    for (var i = 0; i < imageBuffer.length; i++) {
        if (imageBuffer[i] != lastSend[i]) {
            if (skip > 0) {
                output.push(0);
                output.push(skip);

                skip = 0;
            }

            current.push(imageBuffer[i]);
        } else {
            if (current.length > 0) {
                output.push(1);
                output.push(current.length);
                output = output.concat(current);
                
                current = [];
            }

            skip++;
        }
    }

    if (current.length > 0) {
        output.push(1);
        output.push(current.length);
        output = output.concat(current);
    }

    console.timeEnd("diff check");

    var data_16 = Uint16Array.from(output);
    var data_8 = new Uint8Array(data_16.buffer);

    console.log("bytes to send:", data_8.length);

    /*
    deflate(data_8, (err, buffer) => {
        console.log(buffer.length)
    }, {options: constants.Z_NO_COMPRESSION});
    */

    lastSend = imageBuffer;

    //send


    

    var recv_16 = new Uint16Array(data_8.buffer);
    
    let fullSize = recv_16.length;

    console.time("fixing");
    let index = 0;
    let offset = 0;

    //output2.fill(256 * 192 * 3)

    while(index < fullSize){
        let type = recv_16[index + 0];
        let len  = recv_16[index + 1];

        //console.log({index, type, len});

        if(type == 1){
            //memcpy(VRAM_A + offset, &recvBuff[index + 4], len * 2);
            
            let localIndex = 0;

            while((localIndex / 3) < len){
                var bundle = recv_16[index + localIndex / 3 + 2];

                //console.log({index, offset, bundleIndex});

                output2[offset + localIndex + 0] = ((bundle & 31) << 3);
                output2[offset + localIndex + 1] = ((bundle & 992) >> 5) << 3;
                output2[offset + localIndex + 2] = ((bundle & 31744) >> 10) << 3;

                localIndex += 3;
            }

            index += len;
        }

        offset += len * 3;
        index += 2;
    }

    console.timeEnd("fixing");

    //console.log(recv_16.length);
    
    //console.log(output2);

    console.time("save")
    const image = sharp(output2, {
        raw: {
            width: 256,
            height: 192,
            channels: 3
        }
    });

    await image.toFile("out.png");

    console.timeEnd("save");

    console.timeEnd("total");

    SendScreenshot(socket);

    //console.log("done");

    //console.log(data_16);
    //console.log(data_8);

    /*
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
    */


    /*
    deflate(data_8, (err, buffer) => {
        console.log(buffer.length)
    }, {options: constants.Z_NO_COMPRESSION});
    */
}

SendScreenshot(null);