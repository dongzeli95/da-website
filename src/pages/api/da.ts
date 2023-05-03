// pages/api/da.ts

import { NextRequest } from "next/server";

export const config = {
    runtime: "edge",
  };

const handler = async (req: NextRequest) => {
  // Get datasource_id and prompt from the request body
  const serviceUrl = process.env.SERVICE_URL;
  const url = serviceUrl + "/v1/analyze"
  const { datasource_id, dashboard_id, prompt, org_id } = await req.json();

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
};

export default handler;