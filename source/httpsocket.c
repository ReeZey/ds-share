/*---------------------------------------------------------------------------------

---------------------------------------------------------------------------------*/
#include <nds.h>
#include <dswifi9.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>

#include <stdio.h>
#include <string.h>

void getHttp(char* url) {
    struct hostent * myhost = gethostbyname( url );


    iprintf("Creating socket... ");

    int my_socket = socket( AF_INET, SOCK_STREAM, 0 );
    if(my_socket == -1){
        iprintf("Failed!\n");
        return;
    }
    
    iprintf("Success!\n");

    struct sockaddr_in sain;

    sain.sin_family = AF_INET;
    sain.sin_port = htons(1337);
    sain.sin_addr.s_addr= *( (unsigned long *)(myhost->h_addr_list[0]) );
	
	iprintf("Connecting to socket... ");

    int connection = connect( my_socket,(struct sockaddr *)&sain, sizeof(sain) );
    if(connection == -1){
        iprintf("Failed!\n");
        return;
    }
    
    iprintf("Success!\n");

    int success = 1;

    while(success != -1) {
        swiWaitForVBlank();
		scanKeys();

		int pressed = keysDown();

        char text[sizeof(pressed)];
        sprintf(text, "%d", pressed);

        success = send(my_socket, text, strlen(text), 0);
	}

	iprintf("oh no he disconnected!\n");

	shutdown(my_socket,0);
	closesocket(my_socket);
}

int main(void) {

    int x, y;

    //set the mode to allow for an extended rotation background
    videoSetMode(MODE_5_2D);
    videoSetModeSub(MODE_5_2D);

    //allocate a vram bank for each display
    vramSetBankA(VRAM_A_MAIN_BG);
    vramSetBankC(VRAM_C_SUB_BG);

    

    //create a background on each display
    int bgMain = bgInit(3, BgType_Bmp16, BgSize_B16_256x256, 0,0);
    int bgSub = bgInitSub(3, BgType_Bmp16, BgSize_B16_256x256, 0,0);

    u16* videoMemoryMain = bgGetGfxPtr(bgMain);
    u16* videoMemorySub = bgGetGfxPtr(bgSub);


    //initialize it with a color
    for(x = 0; x < 256; x++){
        for(y = 0; y < 192; y++){
            videoMemoryMain[x + y * 256] = ARGB16(1, 255, 0, 0);
            videoMemorySub[x + y * 256] = ARGB16(1, 0, 0, 31);
        }
    }
        

    while(1) 
    {
        swiWaitForVBlank();
    }


    /*

	if(!Wifi_InitDefault(WFC_CONNECT)) {
		iprintf("Failed to connect!\n");
	} else {

		iprintf("Connected\n\n");

		getHttp("10.0.0.76");
	}

    iprintf("uhh something\n");

	while(1) {
		swiWaitForVBlank();
        int keys = keysDown();
        if(keys & KEY_START) break;
	}

    iprintf("return\n");

    while(1) {
		swiWaitForVBlank();
        int keys = keysDown();
        if(keys & KEY_SELECT) break;
	}
    */

	return 0;
}