//|-----------------------------------------------------------------------------
//|            This source code is provided under the MIT license             --
//|  and is provided AS IS with no warranty or guarantee of fit for purpose.  --
//|                See the project's LICENSE.md for details.                  --
//|           Copyright Refinitiv 2022.       All rights reserved.            --
//|-----------------------------------------------------------------------------

// Example Code Disclaimer:
// ALL EXAMPLE CODE IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS FOR ILLUSTRATIVE PURPOSES ONLY. REFINITIV MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE EXAMPLE CODE, OR THE INFORMATION, CONTENT, OR MATERIALS USED IN CONNECTION WITH THE EXAMPLE CODE. YOU EXPRESSLY AGREE THAT YOUR USE OF THE EXAMPLE CODE IS AT YOUR SOLE RISK.


import { parse } from "https://deno.land/std@0.150.0/flags/mod.ts";
import { encode } from "https://deno.land/std@0.150.0/encoding/base64.ts";
import {
  RDP_AuthToken_Type,
  RDP_reqAuthRevoke_Type,
  RDP_ReqSymbology_Type,
  RDP_ResSymbology_Table_Type,
} from "./rdp_types.ts";

class RDPController {
  readonly rdpServer: string = Deno.env.get("RDP_BASE_URL") ||
    "https://api.refinitiv.com";
  readonly rdpAuthURL: string = Deno.env.get("RDP_AUTH_URL") ||
    "/auth/oauth2/v1/token";
  readonly rdpNewsHeadlinesURL: string = Deno.env.get("RDP_NEWS_URL") ||
    "/data/news/v1/headlines";
  readonly rdpNewsStoryURL: string = Deno.env.get("RDP_STORY_URL") ||
    "/data/news/v1/stories";
  readonly rdpChainURL: string = Deno.env.get("RDP_CHAIN_URL") ||
    "/data/pricing/chains/v1";
  readonly rdpSymbology: string = Deno.env.get("RDP_SYMBOLOGY_URL") ||
    "/discovery/symbology/v1/lookup";
  readonly rdpAuthRevokeURL: string = Deno.env.get("RDP_AUTH_REVOKE_URL") ||
    "/auth/oauth2/v1/revoke";
  readonly scope: string = "trapi";
  takeExclusiveSignOnControl: boolean;

  constructor() {
    this.takeExclusiveSignOnControl = true;
  }

  authenticationRDP = async (
    username: string,
    password: string,
    client_id: string,
    refresh_token: string,
  ): Promise<RDP_AuthToken_Type> => {
    if (
      username.length === 0 || password.length === 0 || client_id.length === 0
    ) {
      throw new Error("Received invalid (None or Empty) arguments");
    }

    const authenURL = `${this.rdpServer}${this.rdpAuthURL}`;
    console.log(`Requesting Authenticaion Token from ${authenURL}`);

    let authReqMsg = "";
    //Init Authentication Request Message and First Login scenario
    if (refresh_token.length === 0) {
      authReqMsg =
        `username=${username}&client_id=${client_id}&password=${password}&scope=${this.scope}&grant_type=password&takeExclusiveSignOnControl=${this.takeExclusiveSignOnControl}`;
    } else { //For the Refresh_Token scenario
      authReqMsg =
        `username=${username}&client_id=${client_id}&refresh_token=${refresh_token}&grant_type=refresh_token&takeExclusiveSignOnControl=${this.takeExclusiveSignOnControl}`;
    }

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

  revokeAuthenticaion = async (client_id: string, access_token: string) => {
    if (client_id.length === 0 || access_token.length === 0) {
      throw new Error("Received invalid (None or Empty) arguments");
    }

    const authenURL = `${this.rdpServer}${this.rdpAuthRevokeURL}`;
    const authReq: RDP_reqAuthRevoke_Type = {
      "token": access_token,
    };

    //const clientIDBase64: string = Buffer.from(`${new TextEncoder().encode(client_id)}:`).toString('base64')

    const clientIDBase64: string = encode(`${client_id}:`);

    // Send HTTP Request
    const response = await fetch(authenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${clientIDBase64}`,
      },
      body: new URLSearchParams(authReq),
    });

    if (!response.ok) {
      const statusText = await response.text();
      throw new Error(`HTTP error!: ${response.status} ${statusText}`);
    }

    console.log("Authentication Revoked");
  };

  getChain = async (symbol: string, access_token: string) => {
    if (symbol.length === 0 || access_token.length === 0) {
      throw new Error("Received invalid (None or Empty) arguments");
    }

    const param = { universe: symbol };
    const chainURL = `${this.rdpServer}${this.rdpChainURL}/?${
      new URLSearchParams(param).toString()
    }`;

    console.log(`Requesting Chain Data from ${chainURL}`);

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

  getSymbology = async (symbols: string[], access_token: string) => {
    const symbologyURL = `${this.rdpServer}${this.rdpSymbology}`;

    console.log(`Requesting PermID Data from ${symbologyURL}`);

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
}

class Application {
  // RDP Credentials

  rdpAuthObj: RDP_AuthToken_Type = {
    access_token: "",
    refresh_token: "",
    expires_in: "",
    scope: "",
    token_type: "",
  };

  rdpHTTPApp: RDPController;
  itemName: string;
  username: string;
  password: string;
  clientid: string;
  limit: number;

  constructor(
    username: string,
    password: string,
    clientid: string,
    itemname: string,
    limit: number,
  ) {
    this.rdpHTTPApp = new RDPController();
    this.username = username;
    this.password = password;
    this.clientid = clientid;
    this.itemName = itemname;
    this.limit = limit;
  }

  run = async () => {
    try {
      this.rdpAuthObj = await this.rdpHTTPApp.authenticationRDP(
        this.username,
        this.password,
        this.clientid,
        this.rdpAuthObj.refresh_token,
      );
      console.log(this.rdpAuthObj);

      const chainData = await this.rdpHTTPApp.getChain(
        this.itemName,
        this.rdpAuthObj.access_token,
      );
      console.log(chainData);

      if (this.limit > chainData["data"]["constituents"].length) {
        throw new Error(
          `Input limit (${this.limit}) is higher than numbers of Chain (${
            chainData["data"]["constituents"].length
          })`,
        );
      }

      const permIDData = await this.rdpHTTPApp.getSymbology(
        chainData["data"]["constituents"].slice(0, this.limit),
        this.rdpAuthObj.access_token,
      );
      //console.log(JSON.stringify(permIDData))
      this.displayPermID(permIDData);

      await this.rdpHTTPApp.revokeAuthenticaion(
        this.clientid,
        this.rdpAuthObj.access_token,
      );
    } catch (error) {
      console.log(error);
      Deno.exit(1);
    }
  };

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

const flags = parse(Deno.args, {
  string: ["username", "password", "clientid", "chainric"],
  default: { chainric: ".AV.O", limit: 10 },
})

console.log(Deno.args)

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
);
app.run();

//deno run --allow-env --allow-net ./src/main.ts --username $RDP_USERNAME --password $RDP_PASSWORD --clientid $RDP_APP_KEY --chainric 0#.HSI
