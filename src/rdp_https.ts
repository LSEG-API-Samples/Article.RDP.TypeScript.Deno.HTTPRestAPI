//|-----------------------------------------------------------------------------
//|            This source code is provided under the MIT license             --
//|  and is provided AS IS with no warranty or guarantee of fit for purpose.  --
//|                See the project's LICENSE.md for details.                  --
//|           Copyright Refinitiv 2022.       All rights reserved.            --
//|-----------------------------------------------------------------------------

// Example Code Disclaimer:
// ALL EXAMPLE CODE IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS FOR ILLUSTRATIVE PURPOSES ONLY. REFINITIV MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE EXAMPLE CODE, OR THE INFORMATION, CONTENT, OR MATERIALS USED IN CONNECTION WITH THE EXAMPLE CODE. YOU EXPRESSLY AGREE THAT YOUR USE OF THE EXAMPLE CODE IS AT YOUR SOLE RISK.

// Deno STD libraries
import { encode } from "https://deno.land/std@0.150.0/encoding/base64.ts";

// Importing Types
import {
  RDP_AuthToken_Type,
  RDP_reqAuthRevoke_Type,
  RDP_ReqSymbology_Type,
} from "./rdp_types.ts";

// A Class that handles all HTTP operations.
export class RDPController {
  //Set Up HTTP APIs URLs
  readonly rdpServer: string = Deno.env.get("RDP_BASE_URL") ||
    "https://api.refinitiv.com";
  readonly rdpAuthURL: string = Deno.env.get("RDP_AUTH_URL") ||
    "/auth/oauth2/v1/token";
  readonly rdpChainURL: string = Deno.env.get("RDP_CHAIN_URL") ||
    "/data/pricing/chains/v1";
  readonly rdpSymbology: string = Deno.env.get("RDP_SYMBOLOGY_URL") ||
    "/discovery/symbology/v1/lookup";
  readonly rdpAuthRevokeURL: string = Deno.env.get("RDP_AUTH_REVOKE_URL") ||
    "/auth/oauth2/v1/revoke";
  
  //Logger
  logger: any;

  constructor(logger: any) {
    this.logger = logger;
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
    console.log(`Requesting Authentication Token from ${authenURL}`);

    let authReqMsg = "";
    //Init Authentication Request Message and First Login scenario
    if (refresh_token.length === 0) {
      authReqMsg =
        `username=${username}&client_id=${client_id}&password=${password}&scope=${scope}&grant_type=password&takeExclusiveSignOnControl=${takeExclusiveSignOnControl}`;
    } else { //For the Refresh_Token scenario
      authReqMsg =
        `username=${username}&client_id=${client_id}&refresh_token=${refresh_token}&grant_type=refresh_token&takeExclusiveSignOnControl=${takeExclusiveSignOnControl}`;
    }

    this.logger.debug(
      `RDPController:authenticationRDP(): Outgoing Request Message = ${authReqMsg}`,
    );

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

  // Send Authentication Revoke Request message to RDP Auth Service
  revokeAuthentication = async (client_id: string, access_token: string) => {
    if (client_id.length === 0 || access_token.length === 0) {
      throw new Error("Received invalid (None or Empty) arguments");
    }

    const authenURL = `${this.rdpServer}${this.rdpAuthRevokeURL}`;
    console.log(`Requesting Authentication Revoke from ${authenURL}`);

    const authReqMsg: RDP_reqAuthRevoke_Type = {
      "token": access_token,
    };
    // Convert client_id to base64 string
    const clientIDBase64: string = encode(`${client_id}:`);

    this.logger.debug(
      `RDPController:revokeAuthentication(): Outgoing Request Message = ${
        JSON.stringify(authReqMsg, null, 2)
      }`,
    );

    // Send HTTP Request
    const response = await fetch(authenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${clientIDBase64}`,
      },
      body: new URLSearchParams(authReqMsg),
    });

    if (!response.ok) {
      const statusText = await response.text();
      throw new Error(`HTTP error!: ${response.status} ${statusText}`);
    }

    console.log("Authentication Revoked");
  };

  // Request Chain Data from RDP Pricing Service
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
    
    //Parse response to JSON
    return await response.json();
  };

  // Request Symbology Lookup Data from RDP Symbology Lookup Service
  getSymbology = async (symbols: string[], access_token: string) => {

    if (symbols.length === 0 || access_token.length === 0) {
      throw new Error("Received invalid (None or Empty) arguments");
    }

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

    this.logger.debug(
      `RDPController:getSymbology(): Outgoing Request Message = ${
        JSON.stringify(payload, null, 2)
      }`,
    );

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



