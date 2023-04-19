// pages/api/da.ts

import { NextRequest } from "next/server";

const externalServiceUrl = "https://da-service-6039-4-1313827042.sh.run.tcloudbase.com/v1/analyze";
// const externalServiceUrl = "https://da-service-dev-6039-4-1313827042.sh.run.tcloudbase.com/v1/analyze";

export const config = {
    runtime: "edge",
  };

const handler = async (req: NextRequest) => {
  // Get datasource_id and prompt from the request body
  const { datasource_id, prompt } = await req.json();
  console.log("datasource_id", datasource_id)
    console.log("prompt", prompt)

  // Set the required JSON body
  const requestBody = {
    datasource_id,
    prompt,
  };

  // Make a POST request to the external service
  const externalRes = await fetch(externalServiceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.log("externalRes", externalRes)

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