import robot from "robotjs";
import sharp from "sharp";
import Net from 'net';
import { deflate, constants } from 'node:zlib';
import * as fs from 'fs';

const server = new Net.Server();
const port = 1337;

server.listen(port, () => {
    console.log(`server running port: ${port}`);
});

server.on('connection', (socket) => {
    console.log('A new connection has been established.');

    socket.on('data', async (chunk) => {
        console.log(new Date(), chunk);

        if(chunk[0] == 0){
            SendScreenshot(socket);
        }
    });
});

var lastSend = new Uint16Array(256 * 192 * 4);
var output2 = new Uint8Array(256 * 192 * 3);

async function SendScreenshot(socket) {
    const im = robot.screen.capture(0, 0, 1280, 720);
    const rescaled = await sharp(im.image, { raw: { width: im.width, height: im.height, channels: im.bytesPerPixel } }).resize(256, 192, { fit: "fill" }).raw().toBuffer();

    var imageBuffer = new Uint16Array(256 * 192);
    for (var i = 0; i < rescaled.length; i += 4) {
        imageBuffer[i >> 2] = (((rescaled[i + 3] ? 1 : 0) << 15) | (rescaled[i + 2] >> 3) | ((rescaled[i + 1] >> 3) << 5) | ((rescaled[i] >> 3) << 10));
    }

    var current = new Uint16Array(256 * 192 * 4);
    var output = new Uint16Array(256 * 192 * 4);

    var currentIndex = 0;
    var outputIndex = 0;

    var skip = 0;

    for (var i = 0; i < imageBuffer.length; i++) {
        if (imageBuffer[i] ^ lastSend[i]) {
            if (skip > 0) {
                output[outputIndex] = 0;
                output[outputIndex+1] = skip;

                outputIndex += 2;

                skip = 0;
            }

            current[currentIndex] = imageBuffer[i];
            currentIndex++;
        } else {
            if (currentIndex > 0) {
                output[outputIndex] = 1;
                output[outputIndex + 1] = currentIndex;

                outputIndex += 2;

                for(var j = 0; j < currentIndex; j++){
                    output[outputIndex + j] = current[j]; 
                }

                outputIndex += currentIndex;
                
                currentIndex = 0;
            }

            skip++;
        }
    }

    if (currentIndex > 0) {
        output[outputIndex] = 1;
        output[outputIndex + 1] = currentIndex;

        outputIndex += 2;

        for(var j = 0; j < currentIndex; j++){
            output[outputIndex + j] = current[j]; 
        }
        
        outputIndex += currentIndex;
    }

    var data_8 = new Uint8Array(output.buffer, output.byteOffset, outputIndex * 2);

    //console.log(output);
    //console.log(data_8);

    /*
    deflate(data_8, (err, buffer) => {
        console.log(buffer.length)
    }, {options: constants.Z_NO_COMPRESSION});
    */

    //send

    if(socket != null){
        var fullsize = data_8.length;

        var buff = Buffer.alloc(4);
        buff.writeUint32LE(fullsize);
        console.log({fullsize});

        socket.write(Buffer.concat([buff, data_8]));
        //socket.write(buff);
        //socket.write(data_8);

        lastSend = imageBuffer;
        
        
        return;
    }

    /*
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

    //console.log("done");

    //console.log(data_16);
    //console.log(data_8);

    */
    //SendScreenshot(null);

    /*
    deflate(data_8, (err, buffer) => {
        console.log(buffer.length)
    }, {options: constants.Z_NO_COMPRESSION});
    */
}

//SendScreenshot(null);