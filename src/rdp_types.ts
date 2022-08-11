//|-----------------------------------------------------------------------------
//|            This source code is provided under the MIT license             --
//|  and is provided AS IS with no warranty or guarantee of fit for purpose.  --
//|                See the project's LICENSE.md for details.                  --
//|           Copyright Refinitiv 2022.       All rights reserved.            --
//|-----------------------------------------------------------------------------

// Example Code Disclaimer:
// ALL EXAMPLE CODE IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS FOR ILLUSTRATIVE PURPOSES ONLY. REFINITIV MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE EXAMPLE CODE, OR THE INFORMATION, CONTENT, OR MATERIALS USED IN CONNECTION WITH THE EXAMPLE CODE. YOU EXPRESSLY AGREE THAT YOUR USE OF THE EXAMPLE CODE IS AT YOUR SOLE RISK.

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

// sub-Type for RDP Symbology Lookup request message
type RDP_Symbology_From_Type = {
  identifierTypes: string[];
  values: string[];
};

// sub-Type for RDP Symbology Lookup request message
type RDP_Symbology_To_Type = {
  objectTypes: string[];
  identifierTypes: string[];
};

// Type for RDP Symbology Lookup PermIDs Valid Response message
export type RDP_ResSymbology_Table_Type = {
  data: RDP_ResSymbology_PermID_Type[];
};

// sub-Type for RDP Symbology Lookup PermIDs data
type RDP_ResSymbology_PermID_Type = {
  RIC: string;
  PermID: string;
};
