# Experimenting Deno JavaScript runtime with HTTP REST API application.

**This project is not finished yet**.

## <a id="intro"></a>Introduction

This example project shows how to implement a console [TypeScript](https://www.typescriptlang.org) application to retrieve financial data from HTTP REST API with Deno JavaScript runtime. The application uses the [Refinitiv Data Platform (RDP) APIs](https://developers.refinitiv.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis) as the example HTTP REST APIs. The project is implemented and run in a controlled environment such as [Docker](https://www.docker.com/) and [devcontainer](https://code.visualstudio.com/docs/remote/containers) using the [Deno Docker Image](https://hub.docker.com/r/denoland/deno). 

## Deno features
- Support Base64 encoding out of the box
- Support command line arguments out of the box

## <a id="prerequisite"></a>Prerequisite
This demo project requires the following dependencies.
1. RDP Access credentials.
2. [Visual Studio Code](https://code.visualstudio.com/) editor.
3. [Docker Desktop/Engine](https://docs.docker.com/get-docker/) application.
4. [VS Code - Remote Development extension pack](https://aka.ms/vscode-remote/download/extension)
5. Internet connection.

Please contact your Refinitiv representative to help you to access the RDP account and services. You can find more detail regarding the RDP access credentials set up from the lease see the *Getting Started for User ID* section of the [Getting Start with Refinitiv Data Platform](https://developers.refinitiv.com/en/article-catalog/article/getting-start-with-refinitiv-data-platform) article.

## How to Run

### <a id="devconainer_run"></a>Running as VS Code DevContainer

1. Go to the project's *.devcontainer* folder and create a file name ```.env.devcontainer```  with the following content.
    ```
    RDP_USERNAME=<RDP UserName>
    RDP_PASSWORD=<RDP Password>
    RDP_APP_KEY=<RDP Client_ID/App Key>

    RDP_BASE_URL=https://api.refinitiv.com
    RDP_AUTH_URL=/auth/oauth2/v1/token
    RDP_AUTH_REVOKE_URL=/auth/oauth2/v1/revoke
    RDP_SYMBOLOGY_URL=/discovery/symbology/v1/lookup
    RDP_CHAIN_URL=/data/pricing/chains/v1
    ```
2. Start a Docker desktop or Docker engine on your machine.
4. Install the [VS Code - Remote Development extension pack](https://aka.ms/vscode-remote/download/extension).
5. Open the VS Code Command Palette with the ```F1``` key, and then select the **Remote-Containers: Reopen in Container** command.
6. Once this build completes, VS Code automatically connects to the container, and automatics initializes the project for developers. 

Now VS Code is ready for the Deno HTTP REST API console example inside this devcontainer.  Developers can build and run the example by pressing the ```F5``` button or selecting the *Run* then *Start Debugging* option from VS Code menu.

### <a id="manual_run"></a>Running as a manual Docker Container

If you want to run the example with a Docker container manually, please follow the steps below.

1. Start Docker
2. create a file name ```.env``` in a *project root* folder with the following content.
    ```
    RDP_USERNAME=<RDP UserName>
    RDP_PASSWORD=<RDP Password>
    RDP_APP_KEY=<RDP Client_ID/App Key>

    RDP_BASE_URL=https://api.refinitiv.com
    RDP_AUTH_URL=/auth/oauth2/v1/token
    RDP_AUTH_REVOKE_URL=/auth/oauth2/v1/revoke
    RDP_SYMBOLOGY_URL=/discovery/symbology/v1/lookup
    RDP_CHAIN_URL=/data/pricing/chains/v1
    ```
3. Build a Docker image with the following command:
    ```
    $> docker build . -t deno_http_app
    ```
4. Run a Docker container with the following command: 
    ```
    $> docker run -it --name deno_http_app --env-file .env deno_http_app --username %RDP_USERNAME% --password %RDP_PASSWORD% --clientid %RDP_CLIENTID/APPKEY% --chainric <Chain RIC> --limit <numbers of RICs to get PermID>
    ```
5. To stop and delete a Docker container, press ``` Ctrl+C``` (or run ```docker stop rdp_test_fetch```) then run the following command:
    ```
    $> docker rm deno_http_app
    ```
## Reference

https://medium.com/deno-the-complete-reference/running-deno-in-docker-35756ffff66d

https://deno.land/

https://medium.com/deno-the-complete-reference/json-modules-in-deno-5ecd137a5edc

https://medium.com/deno-the-complete-reference/working-with-url-encoded-data-in-deno-dcf518948a9d



