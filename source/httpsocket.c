#include <nds.h>
#include <dswifi9.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>

#include <stdio.h>
#include <string.h>

char recvBuff[256*192*4];
int fullSize;

u16 tempScreen[256*192];

//https://stackoverflow.com/questions/55178026/reading-more-than-one-message-from-recv
int recv_all(int socket)
{
    recv(socket, &fullSize, sizeof(int), 0);

    printf("fullsize %d\n", fullSize);

    if(fullSize < 0) return -1;

    char* pointr = recvBuff;
    int count = fullSize;

    while (count > 0)
    {
        int ret = recv(socket, pointr, fullSize, 0);
        if (ret <= 0)
        {
            return -1;
        }

        count -= ret;
        pointr += ret;
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

    int wang = 0;

    while(true){
        send(my_socket, &wang, 1, 0);
        int iResult = recv_all(my_socket);
        
        if(iResult == -1){
            iprintf("oh no he disconnected!\n");
            break;
        }

        int index = 0;

        u16 type = 0;
        u16 len = 0;

        u16* tempScreenPtr = tempScreen;

        while(index < fullSize){
            memcpy(&type, &recvBuff[index + 0], 2);
            memcpy(&len, &recvBuff[index + 2], 2);

            if(type == 1){
                memcpy(tempScreenPtr, &recvBuff[index + 4], len * 2);
                index += len * 2;
            }

            tempScreenPtr += len;
            index += 4;
        }
        
        swiWaitForVBlank();
        memcpy(VRAM_A, tempScreen, sizeof(tempScreen));
    }

    shutdown(my_socket, 0);
    closesocket(my_socket);
}

int main(void)
{
    consoleDemoInit();

    videoSetMode(MODE_FB0);
    vramSetBankA(VRAM_A_LCD);

    iprintf("Contacting Wi-Fi... ");

    if (!Wifi_InitDefault(WFC_CONNECT))
    {
        iprintf("Failed!\n");
        return 0;
    }

    iprintf("Connected\n\n");

    while(1){
        swiWaitForVBlank();
        scanKeys();
        int keys = keysDown();

        if(keys & KEY_START){
            iprintf("Laptop Connect\n");
            getHttp("10.0.0.76");
        }

        if(keys & KEY_SELECT){
            iprintf("Main Connect\n");
            getHttp("10.0.0.2");
        }

        /*
        
            if u wish to use this for some reason,
            you replace either main connect or laptop connect
            with your IP
        
        */
    }
    
    return 0;
}