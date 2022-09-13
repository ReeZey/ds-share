#include <nds.h>
#include <dswifi9.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>

#include <stdio.h>
#include <string.h>

u16 *videoMemoryMain;
// u16 *videoMemorySub;

//https://stackoverflow.com/questions/55178026/reading-more-than-one-message-from-recv
int recv_all(int socket, u16 *buffer_ptr, size_t bytes_to_recv)
{
    size_t original_bytes_to_recv = bytes_to_recv;
    iprintf("1.");
    while (bytes_to_recv > 0)
    {
        iprintf("%d\n", bytes_to_recv);
        int ret = recv(socket, buffer_ptr, bytes_to_recv, 0);
        if (ret <= 0)
        {
            return ret;
        }

        bytes_to_recv -= ret;
        buffer_ptr += ret;
    }

    iprintf("2.");
    return original_bytes_to_recv;
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

    u16 recvBuff[192*256];
    int len = sizeof(recvBuff);
    
    recv_all(my_socket, recvBuff, len);
    memcpy(videoMemoryMain, recvBuff, len);

    iprintf("oh no he disconnected!\n");

    shutdown(my_socket, 0);
    closesocket(my_socket);
}

int main(void)
{
    int test = ARGB16(1,255,255,255);
    printf("colur: %d", test);

    consoleDemoInit();

    videoSetMode(MODE_5_2D);
    // videoSetModeSub(MODE_5_2D);

    vramSetBankA(VRAM_A_MAIN_BG);
    // vramSetBankC(VRAM_C_SUB_BG);

    int bgMain = bgInit(3, BgType_Bmp16, BgSize_B16_256x256, 0, 0);
    // int bgSub = bgInitSub(3, BgType_Bmp16, BgSize_B16_256x256, 0, 0);

    videoMemoryMain = bgGetGfxPtr(bgMain);
    // videoMemorySub = bgGetGfxPtr(bgSub);

    iprintf("Contacting Wi-Fi... ");

    if (!Wifi_InitDefault(WFC_CONNECT))
    {
        iprintf("Failed!\n");
    }
    else
    {
        iprintf("Connected\n\n");
        getHttp("10.0.0.76");
    }

    while(1){
        swiWaitForVBlank();
    }
    
    return 0;
}