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
- Supports Web [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) natively.
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

## <a id="project_structure"></a> Project Structure Overview

This example project is a TypeScript console application that login to the RDP platform, then requests the Chain data and PermID information from the RDP Pricing-Chain and Symbology services respectively. The project source code are as follows:

* src/main.ts: The main console application class.
* src/rdp_https.ts: The main RDP HTTP operations class.
* src/rdp_types.ts: The Type Aliases file.

### <a id="ts_main_file"></a>Main Application Code Introduction

Let me start by explaining the ```main.ts``` file code overview. It is the main application class that receives a user input for RDP credentials and a chain symbol name. Then it authenticates and gets data from the RDP RDP services, and displays that data in a console. The file contains the ```Application``` class that manages all application logic such as receiving user input information, format, and display data.

The overview code structure of the file is shown below.

```
// main.ts

// Import RDPController class for HTTP operations
import { RDPController } from "./rdp_https.ts";

// Importing Types
import {
  RDP_AuthToken_Type,
  RDP_ResSymbology_Table_Type,
} from "./rdp_types.ts";

// Main Application Logic class
class Application {

  //RDP Token Auth object
  rdpAuthObj: RDP_AuthToken_Type = {
    access_token: "",
    refresh_token: "",
    expires_in: "",
    scope: "",
    token_type: "",
  };

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
    itemName: string,
    limit: number
  ) {
    this.username = username;
    this.password = password;
    this.clientid = clientid;
    this.itemName = itemName;
    this.limit = limit;

    this.rdpHTTPApp = new RDPController();
  }
  
  //Main run function
  run = async () => {
    //Get RDP authentication, get and display data from RDP.
    try {
      //Send authentication request
      this.rdpAuthObj = await this.rdpHTTPApp.authenticationRDP(
        this.username,
        this.password,
        this.clientid,
        this.rdpAuthObj.refresh_token,
      );
      // Get RDP Data
      ....
    } catch (error) {
      //console.log(error);
      this.logger.error(error);
      Deno.exit(1);
    }
  };
  ...
};

// ---------------- Main Function ---------------------------------------- //

const app = new Application(...);
// Running the application
app.run();

```
### <a id="ts_rdp_http_file"></a>RDP HTTP Class Code Introduction

Now let me turn to the ```rdp_https.ts``` file which is the main RDP HTTP operations class. It manages all request-response messages between the application and the RDP services (Authentication, Pricing, and Symbology). 

The overview code structure of the file is shown below.

```
// rdp_https.ts

// Importing Types
import {
  RDP_AuthToken_Type,
  RDP_reqAuthRevoke_Type,
  RDP_ReqSymbology_Type,
} from "./rdp_types.ts";

// A Class that handles all HTTP operations.
export class RDPController {
  ...
  // Send HTTP Post request to get Access Token (Password Grant and Refresh Grant) from RDP Auth Service
  authenticationRDP = async (...) => {
    ...
  };

  // Request Chain Data from RDP Pricing Service
  getChain = async (symbol: string, access_token: string) => {
    ...
  };

  // Request Symbology Lookup Data from RDP Symbology Lookup Service
  getSymbology = async (symbols: string[], access_token: string) => {
    ...
  };
  ...
};
```

### <a id="ts_type_aliases"></a>RDP Type Aliases Code Introduction

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
That covers the classes and project structure overview.

## <a id="rdp_workflow"></a>RDP APIs Application Workflow

Now, what about the API workflow? Refinitiv Data Platform entitlement check is based on OAuth 2.0 specification. The first step of an application workflow is to get a token from RDP Auth Service, which will allow access to the protected resource, i.e. data REST API. 

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

Let’s start with the authentication source code implementation in more detail with Deno. Please note that we are focusing on the ```rdp_https.ts``` controller class here.

### Initialize Code

Firstly, we import and crate all necessary types, objects, and variables for the API endpoints in the main application files. 

```
// rdp_https.ts

import {
  RDP_AuthToken_Type
} from "./rdp_types.ts";

// A Class that handles all HTTP operations.
export class RDPController {
  //Set Up HTTP APIs URLs
  readonly rdpServer: string = Deno.env.get("RDP_BASE_URL") ||
    "https://api.refinitiv.com";
  readonly rdpAuthURL: string = Deno.env.get("RDP_AUTH_URL") ||
    "/auth/oauth2/v1/token";
  
  constructor() {
  }
}
```

You may be noticed that the code imports Types (and class files) directly from the relative path using ES Modules syntax. Deno supports the absolute path and HTTPS URLs too.

My next point is the environment variable which is used for setting the API endpoints at run time. Deno lets developers access environment variables via the ```Deno.env``` object. Please note that access to environment variables is only possible if the Deno process is running with the **--allow-env* env var permissions flag.

You can find more detail about Deno features above from the following resources:
* [Deno: Importing & Exporting example](https://examples.deno.land/import-export)
* [Deno: Environment Variables example](https://examples.deno.land/environment-variables)

### Sending Authentication Request with Fetch API

That brings us to the ```rdp_https.ts``` that sends and receives HTTP messages with RDP APIs. We create a function named ```authenticationRDP``` in a file to send a login request message to the RDP Auth Token service. The function creates the authentication request message as a form *x-www-form-urlencoded* format and then sends it to the RDP via native Fetch API as an HTTP POST message.

```
// rdp_https.ts

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
  
  constructor() { }
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
```

If the authentication is successful, the function returns the authentication information (*access token*, *refresh token*, etc.) as a JSON message (with ```RDP_AuthToken_Type``` type) to the caller. If the authentication fails, throws the errors as an exception event.

That’s all I have to say about the authentication part.

## <a id="rdp_get_data"></a>Requesting RDP APIs Data

That brings us to requesting the RDP APIs data. All subsequent REST API calls use the Access Token via the *Authorization* HTTP request message header as shown below to get the data. 
- Header: 
    * Authorization = ```Bearer <RDP Access Token>```

Please notice *the space* between the ```Bearer``` and ```RDP Access Token``` values.

The application then creates a request message in a JSON message format or URL query parameter based on the interested service and sends it as an HTTP request message to the Service Endpoint. Developers can get RDP APIs the Service Endpoint, HTTP operations, and parameters from Refinitiv Data Platform's [API Playground page](https://api.refinitiv.com/) - which is an interactive documentation site developers can access once they have a valid Refinitiv Data Platform account.

This project covers the following the RDP APIs Services:
- Pricing Chain ```/data/pricing/chains/v1``` operation.
- Discovery Symbology Service ```/discovery/symbology/v1/lookup``` endpoint that navigates between identifiers.

## <a id="rdp_chain"></a>RDP APIs Pricing Chain Service

I will begin with the Chain service. The RDP ```/data/pricing/chains/<version>``` endpoint is an HTTP REST API service that returns all constituents of a Chain symbol.

### Sending Chain Request

I will begin by creating a function named ```getChain()``` in the HTTP Controller  ```rdp_https.ts``` file. This function receives a Chain symbol and the access token information to create an HTTP URL with a symbol query parameter as follows

```
// rdp_https.ts

...

// A Class that handles all HTTP operations.
class RDPController {
  //Set Up HTTP APIs URLs
  readonly rdpServer: string = Deno.env.get("RDP_BASE_URL") ||
    "https://api.refinitiv.com";
  readonly rdpChainURL: string = Deno.env.get("RDP_CHAIN_URL") ||
    "/data/pricing/chains/v1";
  
  ...

  // Request Chain Data from RDP Pricing Service
  getChain = async (symbol: string, access_token: string) => {
    
    const param = { universe: symbol };
    const chainURL = `${this.rdpServer}${this.rdpChainURL}/?${
      new URLSearchParams(param).toString()
    }`;

    console.log(`Requesting Chain Data from ${chainURL}`);
    ...
  };
  ...
}
```

Then sends it to the RDP Chain service as an HTTP *GET* operation.

```
// rdp_https.ts

...

// A Class that handles all HTTP operations.
class RDPController {

  ...

  // Request Chain Data from RDP Pricing Service
  getChain = async (symbol: string, access_token: string) => {
    
    ...
    // Send HTTP Request
    const response: Response = await fetch(chainURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      const statusText: string = await response.text();
      throw new Error(
        `Get Chain HTTP error!: ${response.status} ${statusText}`,
      );
    }
    console.log("Expand Chain data success.");
    //Parse response to JSON
    return await response.json();
  };
  ...
}
```

If the request is successful, the code sends data back to a caller in a JSON message format. But if the request is failed, it throws an exception with error detail to a caller.

Example Chain response message:

```
{
  "universe": {
    "ric": "0#.SETI",
    "displayName": "SET INDEX",
    "serviceName": "ELEKTRON_DD"
  },
  "data": {
    "constituents": [
      "2S.BK",
      "3K-BAT.BK",
      "7UP.BK",
      "A.BK",
      "AAV.BK",
      ...
      "ZEN.BK"
    ]
  }
}
```
That covers the Chain data part. 

## <a id="rdp_symbology"></a>RDP APIs Symbology Discovery Service

### Sending Symbology Request to get PermID

This example converts a symbol from the RIC Code identifier to [Permanent Identifiers (PermIDs)](https://www.refinitiv.com/en/products/permid-data-management), [LEI](https://en.wikipedia.org/wiki/Legal_Entity_Identifier) using the RDP the Discovery Symbology Service. I will begin by importing the ```PDP_Symbology_Req_Type``` Type Aliases for the Symbology JSON request message, and creating a function named ```getSymbology()``` in the HTTP Controller  ```rdp_https.ts``` file. 

The steps to create the JSON request message are shown below.

```
// rdp_https.ts

// Importing Types
import {
  RDP_AuthToken_Type,
  RDP_reqAuthRevoke_Type,
  RDP_ReqSymbology_Type,
} from "./rdp_types.ts";

...

// A Class that handles all HTTP operations.
class RDPController {

  ...

  // Request Symbology Lookup Data from RDP Symbology Lookup Service
  getSymbology = async (symbols: string[], access_token: string) => {
    ...
    const symbologyURL = `${this.rdpServer}${this.rdpSymbology}`;

    console.log(`Requesting PermID Data from ${symbologyURL}`);
    // Create Symbology Request Message
    const payload: RDP_ReqSymbology_Type = {
      "from": [{
        "identifierTypes": [
          "RIC",
        ],
        "values": symbols,
      }],
      "to": [{
        "objectTypes": [
          "organization",
        ],
        "identifierTypes": [
          "PermID",
        ],
      }],
      "reference": [
        "name",
        "status",
        "classification",
      ],
      "type": "auto",
    };
    ....
  };
  ...
}
```
Then sends it to the RDP Chain service as an HTTP *POST* operation.

```
// rdp_https.ts

...

// A Class that handles all HTTP operations.
class RDPController {

  ...

  // Request Symbology Lookup Data from RDP Symbology Lookup Service
  getSymbology = async (symbols: string[], access_token: string) => {

    ...

    // Send HTTP Request
    const response: Response = await fetch(symbologyURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const statusText: string = await response.text();
      throw new Error(
        `Get Chain HTTP error!: ${response.status} ${statusText}`,
      );
    }
    console.log("Get Symbology Data success.");
    //Parse response to JSON
    return await response.json();
  };
  ...
}
```
### Displaying Symbology Data

The next step is displaying PermIDs data in a readable format. The application uses the [console.table()](https://developer.mozilla.org/en-US/docs/Web/API/console/table) function to print data to a console in a tabular format.

Let's start by creating the new Type Aliases for the Symbology table object named ```RDP_ResSymbology_Table_Type```. This object keeps the necessary output data which are ```RIC```, and ```PermID``` fields from the response JSON message.

```
//rdp_types.ts

// Type for RDP Symbology Lookup PermIDs Valid Response message
export type RDP_ResSymbology_Table_Type = {
  data: RDP_ResSymbology_PermID_Type[];
};

// sub-Type for RDP Symbology Lookup PermIDs data
type RDP_ResSymbology_PermID_Type = {
  RIC: string;
  PermID: string;
};
```

Finally, we create a ```displayPermID()``` function in a ```main.ts``` file to construct the ```permIDDataTable``` object and then passes it to the ```console.table()``` function. 

```
// main.ts

// Import RDPController class for HTTP operations
import { RDPController } from "./rdp_https.ts";

// Importing Types
import {
  RDP_AuthToken_Type,
  RDP_ResSymbology_Table_Type,
} from "./rdp_types.ts";

// Main Application Logic class
class Application {

  ....

  //Main run function
  run = async () => {
    try {
      ....
      //Send PermIDs data request
      const permIDData = await this.rdpHTTPApp.getSymbology(
        chainData["data"]["constituents"].slice(0, this.limit),
        this.rdpAuthObj.access_token,
      );

      //Displaying PermIDs data
      this.displayPermID(permIDData);
    } catch (error) {
      console.log(error);
      Deno.exit(1);
    }
  };

  // Convert PermIDs JSON data to be a table
  displayPermID = (permIDJSON: any) => {
    const permIDData = permIDJSON["data"];

    const permIDDataTable: RDP_ResSymbology_Table_Type = { data: [] };
    let _output: string;

    permIDData.forEach((permid: any) => {
      if (permid["output"].length !== 0) {
        _output = permid["output"][0]["value"];
      } else if (permid["errors"]) {
        _output = permid["errors"][0];
      } else {
        _output = "No PermID information";
      }

      permIDDataTable["data"].push({
        RIC: permid["input"][0]["value"],
        PermID: _output,
      });
    });

    console.table(permIDDataTable["data"]);
  };
}
...
```
The ```console.table()``` result with the ```permIDDataTable``` object is as follows:

![figure-2](images/03_permid_table.png "PermID as table")

That covers the Symbology data conversion part. 

## Using NPM modules with Deno

My next point is using the npm modules with Deno. As I have mentioned earlier, Deno supports the ES Modules system only while Node.js supports both CommonJS and ES Modules. Their internal module systems also work differently. This makes Deno not support the [npm](https://www.npmjs.com/) package eco-system and its massive libraries *as-is*. Deno lets developers access **some npm packages** via the content delivery networks (CDNs) as the remote HTTP modules. The CDNs such as [esm.sh](https://esm.sh/), [Skypack.dev](https://www.skypack.dev/), and [UNPKG](https://unpkg.com/) provide Deno friendly npm packages in the ES Module format and support Deno integration. The example usage is as follows:

```
import React from "https://esm.sh/react";

export default class A extends React.Component {
  render() {
    return <div></div>;
  }
}
```
Please note that **most Node.js and npm packages are still not compatible with Deno** even through the CDNs above. Deno team [just announced](https://deno.com/blog/changes#compatibility-with-node-and-npm) (as of August 2022) that they are working on improving Deno to be more compatible with npm packages. 

You can find more detail about Deno and npm packages from the following Deno resources:
* [Deno: Using npm/Node.js code document](https://deno.land/manual@v1.15.2/npm_nodejs)
* [Deno: Packages from CDNs document](https://deno.land/manual@v1.15.2/npm_nodejs/cdns)
* [Deno: Compatibility with Node and npm announcement](https://deno.com/blog/changes#compatibility-with-node-and-npm)

I am demonstrating Deno and npm package integration with the [Pino](https://www.npmjs.com/package/pino) logger library.

### Integrate Deno with NPM package

[Pino](https://www.npmjs.com/package/pino) is a fast and small logger library for Node.js application. I am using this library to log debug information such as incoming and outgoing HTTP messages if user input **--debug** argument when running the application.

I will begin by importing the following modules to the ```main.ts``` file:
- [Deno:/flags​/mod.ts module](https://doc.deno.land/https://deno.land/std@0.120.0/flags/mod.ts): for parsing command line arguments
- Pino library as remote HTTP modules via [esm.sh](https://esm.sh/) CDN.

```
// main.ts

// Deno STD libraries
import { parse } from "https://deno.land/std@0.150.0/flags/mod.ts";

// NPM library for logging
import pino from "https://esm.sh/pino";

// Main Application Logic class
class Application {
}

//Parsing command line arguments
const flags = parse(Deno.args, {
  string: ["username", "password", "clientid", "chainric"],
  boolean: ["debug"],
  default: { chainric: ".AV.O", limit: 10, debug: false },
});

if (
  flags.username == null || flags.password == null || flags.clientid == null
) {
  console.log("Please input username, password, and clientid parameters");
  Deno.exit(1);
}

const app = new Application(
  flags.username,
  flags.password,
  flags.clientid,
  flags.chainric,
  flags.limit as number,
  flags.debug,
);
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



