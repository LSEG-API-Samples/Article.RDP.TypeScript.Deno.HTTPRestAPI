# Experimenting Deno JavaScript runtime with HTTP REST API application.
- version: 1.0
- Last update: August, 2022
- Environment: Deno runtime and Docker
- Prerequisite: [Access to RDP credentials](#prerequisite)

**This project is not finished yet**.

Example Code Disclaimer:
ALL EXAMPLE CODE IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS FOR ILLUSTRATIVE PURPOSES ONLY. REFINITIV MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE EXAMPLE CODE, OR THE INFORMATION, CONTENT, OR MATERIALS USED IN CONNECTION WITH THE EXAMPLE CODE. YOU EXPRESSLY AGREE THAT YOUR USE OF THE EXAMPLE CODE IS AT YOUR SOLE RISK.

## <a id="intro"></a>Introduction

[Deno](https://deno.land/) is a JavaScript,[TypeScript](https://www.typescriptlang.org/), and [WebAssembly](https://webassembly.org/) runtime based on the V8 JavaScript engine that is written in [Rust](https://www.rust-lang.org/). It is co-created by Ryan Dahl, who also created [Node.js](https://nodejs.org/en/) JavaScript runtime. 

Deno was announced on 2018 on Ryan's [JSConf](https://jsconf.com/) EU 2018 talk [10 Things I Regret About Node.js](https://www.youtube.com/watch?v=M3BM9TB-8yA) admit his initial design decisions with Node.js such as not using promises, the legacy build system, node_modules, package.json, etc which lead to many Node.js drawbacks. In the same talk, Ryan introduced Deno as a new runtime that aims to simplify web platform development with a modern and secure design by default.

This example project shows how to implement a console [TypeScript](https://www.typescriptlang.org) application to retrieve financial data from HTTP REST API with Deno. The application uses the [Refinitiv Data Platform (RDP) APIs](https://developers.refinitiv.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis) as the example HTTP REST APIs to consume Refinitiv data. The project is implemented and run in a controlled environment such as [Docker](https://www.docker.com/) and [devcontainer](https://code.visualstudio.com/docs/remote/containers) using the [Deno Docker Image](https://hub.docker.com/r/denoland/deno). 

**Note**:
Please be informed that this demo project aims for Development and POC purposes only. 

## <a id="intro_deno"></a>What is Deno?

Deno is a simple, modern, and secure JavaScript, TypeScript, and WebAssembly runtime with web platform APIs for both frontend and backend web developments. Deno emphasizes event-driven architecture and supports non-blocking core I/O same as Node.js. Developers can create web servers, server-side, and web browser applications in with productive and secure development environment than Node.

### <a id="deno_node"></a>Difference between Deno and Node.js

Even though both Deno and Node.js are built on Google's V8 JavaScript engine, Deno mainly deviates from Node.js in the following points:

- Secure by default. No file, network, or environment access, unless explicitly enabled at runtime.
- Ships only a single executable file (```Deno```). 
- Deno executable file takes on the role of both runtime and package manager. It supports only URLs for loading local or remote dependencies, similar to browsers, so the ```package.json``` file and package manager (like Node.js's ```npm```) is not required.
- Supports TypeScript out of the box.
- Supports native [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
- Supports only [ES Modules](https://tc39.es/ecma262/#sec-modules) (```import x from y```) like browsers where Node.js supports both ES Modules and [CommonJS](https://www.commonjs.org/) (```require()```).
- All [async actions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) in Deno return a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
- Comes with a set of standard modules such as Base64, command line arguments parsing, JSON, dotenv, file system, HTTP, etc that can be loaded via URLs on the fly.
- Provides built-in development tools such as a code formatter (```deno fmt```), a linter (```deno lint```), and a test runner (```deno test```), etc.
- And much more

Example Deno Code for the HTTP server from [Deno official page](https://examples.deno.land/http-server):

```
//http-server.ts

import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

function handler(_req: Request): Response {
  return new Response("Hello, World!");
}

serve(handler);
```
Running code using Deno CLI (please noticed **--allow-net** flag to explicit enable network access):

```
deno run --allow-net http-server.ts
```

This example project is focusing on Deno version 1.24.1. 

## <a id="whatis_rdp"></a>What is Refinitiv Data Platform (RDP) APIs?

The [Refinitiv Data Platform (RDP) APIs](https://developers.refinitiv.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis) provide various Refinitiv data and content for developers via easy-to-use Web-based API.

RDP APIs give developers seamless and holistic access to all of the Refinitiv content such as Environmental Social and Governance (ESG), News, Research, etc, and commingled with their content, enriching, integrating, and distributing the data through a single interface, delivered wherever they need it.  The RDP APIs delivery mechanisms are the following:
* Request - Response: RESTful web service (HTTP GET, POST, PUT or DELETE) 
* Alert: delivery is a mechanism to receive asynchronous updates (alerts) to a subscription. 
* Bulks:  deliver substantial payloads, like the end-of-day pricing data for the whole venue. 
* Streaming: deliver real-time delivery of messages.

This example project is focusing on the Request-Response: RESTful web service delivery method only.  

![figure-2](images/02_rdp.png "Refinitiv Data Platform")

For more detail regarding the Refinitiv Data Platform, please see the following APIs resources: 
- [Quick Start](https://developers.refinitiv.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis/quick-start) page.
- [Tutorials](https://developers.refinitiv.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis/tutorials) page.

## <a id="project_structure"></a> Project structure

This example project is a TypeScript console application that login to the RDP platform, then requests the Chain data and PermID information from the RDP Pricing-Chain and Symbology services respectively. The project structure is as follows:

```
.
├── .devcontainer
│   ├── .env.devcontainer.example
│   └── devcontainer.json
├── .dockerignore
├── .env.example
├── .gitignore
├── .vscode
│   └── settings.json
├── Dockerfile
├── LICENSE.md
├── README.md
├── images
└── src
    ├── main.ts
    └── rdp_types.ts
```
* src/main.ts: The main console application.
* src/rdp_types.ts: The Type Aliases file.

### <a id="ts_main_file"></a>Example Code Main Application

The ```src/main.ts``` file is the main application class. It receives user input for RDP credentials, operates HTTP request-response messages with the RDP services, and display data in a console.

The overview code structure of the file is shown below.

```
// main.ts

// A Class that handles all HTTP operations.
class RDPController {
    //All HTTP operations with RDP services
    authenticationRDP = async (...) => {
        //Send HTTP request to RDP authentication (v1) service.
    }
    ...
}

// Main Application Logic class
class Application {
   
    run = async () => {
         //Get RDP authentication, get and display data from RDP.
    }
    ...
}

// ---------------- Main Function ---------------------------------------- //

const app = new Application(...);
// Running the application
app.run();

```
- The ```RDPController``` class manages all HTTP operations between the application and RDP services (authentication, pricing, symbology)
- The ```Application``` class manages all application logic such as receiving user input credentials, chain symbol name, format and display data.


### <a id="ts_type_aliases"></a>Example Code Type Aliases

Type Aliases is one of [TypeScript Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) that helps developers type-checking their variables and data in the implementation time to avoid data type errors in a final JavaScript application. 

This example project defines all Type Aliases for the RDP API's JSON request messages (for Auth and Symbology Discover services) and objects used by the application in the ```rdp_types.ts``` file.

```
//rdp_types.ts

// Types for RDP Authentication (success) response message
export type RDP_AuthToken_Type = {
  access_token: string;
  refresh_token: string;
  expires_in: string;
  scope: string;
  token_type: string;
};


// Type for RDP Auth Revoke Token (v1) request message
export type RDP_reqAuthRevoke_Type = {
  token: string;
};

// Type for RDP Symbology Lookup request message
export type RDP_ReqSymbology_Type = {
  from: RDP_Symbology_From_Type[];
  to: RDP_Symbology_To_Type[];
  reference: string[];
  type: string;
};

...
```

## <a id="rdp_workflow"></a>RDP APIs Application Workflow

Refinitiv Data Platform entitlement check is based on OAuth 2.0 specification. The first step of an application workflow is to get a token from RDP Auth Service, which will allow access to the protected resource, i.e. data REST API. 

The API requires the following access credential information:
- Username: The username. 
- Password: Password associated with the username. 
- Client ID: This is also known as ```AppKey```, and it is generated using an App key Generator. This unique identifier is defined for the user or application and is deemed confidential (not shared between users). The client_id parameter can be passed in the request body or as an “Authorization” request header that is encoded as base64.

Once the authentication success, the function gets the RDP Auth service response message and keeps the following RDP token information in the variables.
- **access_token**: The token used to invoke REST data API calls as described above. The application must keep this credential for further RDP APIs requests.
- **refresh_token**: Refresh token to be used for obtaining an updated access token before expiration. The application must keep this credential for access token renewal.
- **expires_in**: Access token validity time in seconds.

Next, after the application received the Access Token (and authorization token) from RDP Auth Service, all subsequent REST API calls will use this token to get the data. Please find more detail regarding RDP APIs workflow in the following resources:
- [RDP APIs: Introduction to the Request-Response API](https://developers.refinitiv.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis/tutorials#introduction-to-the-request-response-api) page.
- [RDP APIs: Authorization - All about tokens](https://developers.refinitiv.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis/tutorials#authorization-all-about-tokens) page.

## <a id="rdp_authen"></a>RDP APIs Authentication

### Initialize Code

Firstly, we import and crate all necessary types, objects, and variables for the API endpoints in the main application ```main.ts``` file. 

```
// main.ts

import {
  RDP_AuthToken_Type
} from "./rdp_types.ts";

// A Class that handles all HTTP operations.
class RDPController {
  //Set Up HTTP APIs URLs
  readonly rdpServer: string = Deno.env.get("RDP_BASE_URL") ||
    "https://api.refinitiv.com";
  readonly rdpAuthURL: string = Deno.env.get("RDP_AUTH_URL") ||
    "/auth/oauth2/v1/token";
  
  constructor(logger: any) {
  }
}
```

You may noticed that the code imports types from ```rdp_types.ts``` file directly from the relative path (```import {RDP_AuthToken_Type} from "./rdp_types.ts";```). It supports the absolute path and HTTPS URLs too.

The API endpoints  will be assigned to the application at run time with the environment variable. Deno lets developers access environment variable via ```Deno.env``` object. Please note that access to environment variables is only possible if the Deno process is running with **--allow-env* env var permissions flag.

Secondly, the application receives RDP credentials, chain symbol, and number of item to get the PermID data via command line arguments. Deno supports command line arguments parsing with the ```Deno.args``` object and ```std/flags``` module ([flags API doc](https://deno.land/std@0.150.0/flags)). The code get command line arguments and send them to the ```Application``` class.

```
// main.ts

// Deno STD libraries
import { parse } from "https://deno.land/std@0.150.0/flags/mod.ts";

import {
  RDP_AuthToken_Type
} from "./rdp_types.ts";

// A Class that handles all HTTP operations.
class RDPController {
  //Set Up HTTP APIs URLs
  readonly rdpServer: string = Deno.env.get("RDP_BASE_URL") ||
    "https://api.refinitiv.com";
  readonly rdpAuthURL: string = Deno.env.get("RDP_AUTH_URL") ||
    "/auth/oauth2/v1/token";
  
  constructor() {
  }
}

// Main Application Logic class
class Application {
  //RDP HTTP Controller class
  rdpHTTPApp: RDPController;

  itemName: string;
  //RDP Credentials
  username: string;
  password: string;
  clientid: string;
  limit: number;

  constructor(
    username: string,
    password: string,
    clientid: string,
    itemname: string,
    limit: number
  ) {
    this.username = username;
    this.password = password;
    this.clientid = clientid;
    this.itemName = itemname;
    this.limit = limit;


    this.rdpHTTPApp = new RDPController();
  }
  
   //Main run function
  run = async () => {
  }
}

// ---------------- Main Function ---------------------------------------- //

//Parsing command line arguments
const flags = parse(Deno.args, {
  string: ["username", "password", "clientid", "chainric"],
  default: { chainric: ".AV.O", limit: 10 },
});

const app = new Application(
  flags.username,
  flags.password,
  flags.clientid,
  flags.chainric,
  flags.limit as number,
);
// Running the application
app.run();
```

### Sending Authentication Request

Then we create a function named ```authenticationRDP``` in ```RDPController``` class to send a login request message to the RDP Auth Token service. The function creates the authentication request message as a form *x-www-form-urlencoded* format and then sends it to the RDP via native Fetch API as an HTTP POST message.

```
// main.ts

// Deno STD libraries
import { parse } from "https://deno.land/std@0.150.0/flags/mod.ts";

import {
  RDP_AuthToken_Type
} from "./rdp_types.ts";

// A Class that handles all HTTP operations.
class RDPController {
  //Set Up HTTP APIs URLs
  readonly rdpServer: string = Deno.env.get("RDP_BASE_URL") ||
    "https://api.refinitiv.com";
  readonly rdpAuthURL: string = Deno.env.get("RDP_AUTH_URL") ||
    "/auth/oauth2/v1/token";
  
  constructor(logger: any) {
  }
  // Send HTTP Post request to get Access Token (Password Grant and Refresh Grant) from RDP Auth Service
  authenticationRDP = async (
    username: string,
    password: string,
    client_id: string,
    refresh_token: string
  ): Promise<RDP_AuthToken_Type> => {

    // Set Up RDP Auth Token additional params .
    const scope = "trapi";
    const takeExclusiveSignOnControl = true;

    if (
      username.length === 0 || password.length === 0 || client_id.length === 0
    ) {
      throw new Error("Received invalid (None or Empty) arguments");
    }

    const authenURL = `${this.rdpServer}${this.rdpAuthURL}`;
    console.log(`Requesting Authenticaion Token from ${authenURL}`);

    let authReqMsg = "";
    //Init Authentication Request Message and First Login scenario
    authReqMsg = `username=${username}&client_id=${client_id}&password=${password}&scope=${scope}&grant_type=password&takeExclusiveSignOnControl=${takeExclusiveSignOnControl}`;

    ...

    // Send HTTP Request
    const response: Response = await fetch(authenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(authReqMsg),
    });

    if (!response.ok) {
      console.log("Authentication Failed");
      const statusText: string = await response.text();
      throw new Error(`HTTP error!: ${response.status} ${statusText}`);
    }
    console.log("Authentication Granted");
    return await response.json();
  };
}

// Main Application Logic class
class Application {
  
  ...

  run = async () => {
    try {
      //Send authentication request
      this.rdpAuthObj = await this.rdpHTTPApp.authenticationRDP(
        this.username,
        this.password,
        this.clientid,
        this.rdpAuthObj.refresh_token,
      );

      //Authentication success
    } catch (error) {
      console.log(error);
      Deno.exit(1);
    }
  };

}

// ---------------- Main Function ---------------------------------------- //

...
// Running the application
app.run();
```



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

Now VS Code is ready for the Deno HTTP REST API console example inside this devcontainer.  Developers can build and run the example with the following command in the VS Code terminal.

```
$> deno run --allow-env --allow-net ./src/main.ts --username $RDP_USERNAME --password $RDP_PASSWORD --clientid $RDP_APP_KEY --chainric <Chain RIC> --limit <numbers of RICs to get PermID> 
```

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
### <a id="debug_run"></a>How to enable the Debug Log

You can enable the HTTP debug log to trace HTTP request-response messages with the ```--debug``` command line argument.

Example:
```
$> docker run -it --name deno_http_app --env-file .env deno_http_app --username %RDP_USERNAME% --password %RDP_PASSWORD% --clientid %RDP_CLIENTID/APPKEY% --chainric <Chain RIC> --limit <numbers of RICs to get PermID> --debug
```
Or add the ```--debug``` parameter to ```"args"``` parameter of the ```launch.json``` configuration file.

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "request": "launch",
            "name": "Launch Program",
            "type": "node",
            "program": "${workspaceFolder}/src/main.ts",
            "cwd": "${workspaceFolder}",
            "runtimeExecutable": "/bin/deno",
            "runtimeArgs": ["run", "--allow-env", "--allow-net"],
			"args": ["--username","${env:RDP_USERNAME}","--password","${env:RDP_PASSWORD}","--clientid","${env:RDP_APP_KEY}","--chainric",".AV.O","--debug"],
            "outputCapture": "std"
        }
    ]
}
```

## Reference

https://medium.com/deno-the-complete-reference/running-deno-in-docker-35756ffff66d

https://deno.land/

https://medium.com/deno-the-complete-reference/json-modules-in-deno-5ecd137a5edc

https://medium.com/deno-the-complete-reference/working-with-url-encoded-data-in-deno-dcf518948a9d



