#include <nds.h>
#include <dswifi9.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>

#include <stdio.h>
#include <string.h>

int bgMain;

//https://stackoverflow.com/questions/55178026/reading-more-than-one-message-from-recv
int recv_all(int socket)
{
    int aa =  192*256*2;
    u16* ptr = bgGetGfxPtr(bgMain);

    while (aa > 0)
    {
        int ret = recv(socket, ptr, aa, 0);
        if (ret <= 0)
        {
            return -1;
        }

        aa -= ret;
        ptr += ret;

        iprintf("diff: %d\n", ret);
    }
    return 0;
}

void getHttp(char *url)
{
    struct hostent *myhost = gethostbyname(url);

    iprintf("Creating socket... ");

    int my_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (my_socket == -1)
    {
        iprintf("Failed!\n");
        return;
    }

    iprintf("Success!\n");

    struct sockaddr_in sain;

    sain.sin_family = AF_INET;
    sain.sin_port = htons(1337);
    sain.sin_addr.s_addr = *((unsigned long *)(myhost->h_addr_list[0]));

    swiWaitForVBlank();
    iprintf("Connecting to socket... ");

    int connection = connect(my_socket, (struct sockaddr *)&sain, sizeof(sain));
    if (connection == -1)
    {
        iprintf("Failed!\n");
        return;
    }

    iprintf("Success!\n");

    int iResult = recv_all(my_socket);

    if(iResult == -1){
        iprintf("oh no he disconnected!\n");
        return;
    }

    iprintf("WE DID IT REDDIT!\n");

    shutdown(my_socket, 0);
    closesocket(my_socket);
}

int main(void)
{
    consoleDemoInit();

    videoSetMode(MODE_5_2D);
    // videoSetModeSub(MODE_5_2D);

    vramSetBankA(VRAM_A_MAIN_BG);
    // vramSetBankC(VRAM_C_SUB_BG);

    bgMain = bgInit(3, BgType_Bmp16, BgSize_B16_256x256, 0, 0);
    // int bgSub = bgInitSub(3, BgType_Bmp16, BgSize_B16_256x256, 0, 0);

    //videoMemoryMain = bgGetGfxPtr(bgMain);
    // videoMemorySub = bgGetGfxPtr(bgSub);
        
    iprintf("Contacting Wi-Fi... ");

    if (!Wifi_InitDefault(WFC_CONNECT))
    {
        iprintf("Failed!\n");
    }
    else
    {
        iprintf("Connected\n\n");
        getHttp("10.0.0.2");
    }

    while(1){
        swiWaitForVBlank();
    }
    
    return 0;
}