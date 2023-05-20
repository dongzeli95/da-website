// pages/api/da.ts

import { NextRequest } from "next/server";

export const config = {
    runtime: "edge",
  };

const baseUrl = process.env.SERVICE_URL;

const handler = async (req: NextRequest) => {
  const {api_name, datasource_id, dashboard_id, prompt, org_id,
      channel_id, area, address, zipcode, residential, weight, notes} = await req.json();
  if (api_name == "analyze") {
    return analyze(datasource_id, dashboard_id, prompt, org_id)
  } else if (api_name == "cost_estimate") {
    return costEstimate(channel_id, area, address, zipcode, residential, weight, notes)
  }
};

async function analyze(datasource_id: string, dashboard_id: string, prompt: string, org_id: string) {
  const url = baseUrl + "/v1/analyze"
  console.log("org_id: " + org_id)
  // Set the required JSON body
  const requestBody = {
    datasource_id,
    dashboard_id,
    prompt,
    org_id
  };

  console.log("requestBody: " + JSON.stringify(requestBody))

  // Make a POST request to the external service
  const externalRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  // Check if the request was successful
  if (!externalRes.ok) {
    return new Response(externalRes.body, {
      status: externalRes.status,
      statusText: externalRes.statusText,
    });
  }

  // Return the response from the external service
  const data = await externalRes.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

async function costEstimate(channel_id: string, area: string, address: string, zipcode: string, residential: boolean, weight: string, notes: string) {
  const url = baseUrl + "/v1/cost_estimate"
  const requestBody = {
    channel_id,
    area,
    address,
    zipcode,
    residential,
    weight,
    notes
  };


  // Make a POST request to the external service
  try{
    const externalRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
      // Check if the request was successful
  if (!externalRes.ok) {
    return new Response(externalRes.body, {
      status: externalRes.status,
      statusText: externalRes.statusText,
    });
  }

  // Return the response from the external service
  const data = await externalRes.json();
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch(error) {
    console.error("Error in fetch call:", error);
  }
}

export default handler;