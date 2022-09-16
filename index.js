import robot from "robotjs";
import sharp from "sharp";

import Net from 'net';
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
            const im = robot.screen.capture(0, 0, 1920, 1080);
            console.timeEnd("screenshot");

            console.time("resize");
            const rescaled = await sharp(im.image, { raw: { width: im.width, height: im.height, channels: im.bytesPerPixel } }).resize(256, 192, { fit: "fill" }).raw().toBuffer();
            console.timeEnd("resize");
        
            console.time("color fix");
            var imageBuffer = new Uint16Array(256*192);
            for(var i = 0; i < rescaled.length; i += 4){
                imageBuffer[i >> 2] = (((rescaled[i + 3] ? 1 : 0) << 15) | (rescaled[i] >> 3) |((rescaled[i + 1] >> 3)<<5)|((rescaled[i + 2] >> 3)<<10));
            }
            console.timeEnd("color fix");

            var data_8 = new Uint8Array(imageBuffer.buffer);
            console.timeEnd("convert");
            socket.write(data_8);
        }
    });
});