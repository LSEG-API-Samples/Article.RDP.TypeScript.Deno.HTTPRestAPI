//|-----------------------------------------------------------------------------
//|            This source code is provided under the MIT license             --
//|  and is provided AS IS with no warranty or guarantee of fit for purpose.  --
//|                See the project's LICENSE.md for details.                  --
//|           Copyright Refinitiv 2022.       All rights reserved.            --
//|-----------------------------------------------------------------------------

// Example Code Disclaimer:
// ALL EXAMPLE CODE IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS FOR ILLUSTRATIVE PURPOSES ONLY. REFINITIV MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE EXAMPLE CODE, OR THE INFORMATION, CONTENT, OR MATERIALS USED IN CONNECTION WITH THE EXAMPLE CODE. YOU EXPRESSLY AGREE THAT YOUR USE OF THE EXAMPLE CODE IS AT YOUR SOLE RISK.

// Deno STD libraries
import { parse } from "https://deno.land/std@0.150.0/flags/mod.ts";

// NPM library for logging
import pino from "https://esm.sh/pino";

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
  logger: any;

  constructor(
    username: string,
    password: string,
    clientid: string,
    itemName: string,
    limit: number,
    debug: boolean,
  ) {
    this.username = username;
    this.password = password;
    this.clientid = clientid;
    this.itemName = itemName;
    this.limit = limit;

    this.logger = pino({ level: debug ? "debug" : "info" });

    this.rdpHTTPApp = new RDPController(this.logger);
  }

  //Main run function
  run = async () => {
    try {
      //Send authentication request
      this.rdpAuthObj = await this.rdpHTTPApp.authenticationRDP(
        this.username,
        this.password,
        this.clientid,
        this.rdpAuthObj.refresh_token,
      );
      this.logger.debug(JSON.stringify(this.rdpAuthObj));

      //Send chain data request
      const chainData = await this.rdpHTTPApp.getChain(
        this.itemName,
        this.rdpAuthObj.access_token,
      );
      this.logger.debug(chainData);

      //check if the constituents array is not empty
      if(chainData["data"]["constituents"].length === 0) {
        throw new Error(`Cannot expaind Chain data of ${this.itemName})`);
      }

      console.log("Expand Chain data success.");
      //check if limit argument is larger than actual chain data.
      if (this.limit > chainData["data"]["constituents"].length) {
        throw new Error(
          `Input limit (${this.limit}) is higher than numbers of Chain (${
            chainData["data"]["constituents"].length
          })`,
        );
      }

      //Send PermIDs data request
      const permIDData = await this.rdpHTTPApp.getSymbology(
        chainData["data"]["constituents"].slice(0, this.limit),
        this.rdpAuthObj.access_token,
      );
      this.logger.debug(JSON.stringify(permIDData));
      //Displaying PermIDs data
      this.displayPermID(permIDData);

      //Send revoke authentication request
      await this.rdpHTTPApp.revokeAuthentication(
        this.clientid,
        this.rdpAuthObj.access_token,
      );
    } catch (error) {
      //console.log(error);
      this.logger.error(error);
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

// ---------------- Main Function ---------------------------------------- //

//Parsing command line arguments
const flags = parse(Deno.args, {
  string: ["username", "password", "clientid", "chainric"],
  boolean: ["debug"],
  default: { chainric: "0#.SETI", limit: 10, debug: false },
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

//deno run --allow-env --allow-net ./src/main.ts --username $RDP_USERNAME --password $RDP_PASSWORD --clientid $RDP_APP_KEY --chainric 0#.HSI --debug
