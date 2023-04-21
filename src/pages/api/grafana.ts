import { NextRequest } from "next/server";

// const externalServiceUrl = "https://da-service-6039-4-1313827042.sh.run.tcloudbase.com/v1/analyze";
const externalServiceUrl = "https://da-service-dev-6039-4-1313827042.sh.run.tcloudbase.com/v1/analyze";

const grafanaUrl = "https://grafana-dev-6039-4-1313827042.sh.run.tcloudbase.com"
const grafanaKey = "eyJrIjoiY09RYW1xNHEyN2FFWmdMZjc2N3RBek9UOE5LZWlTWHQiLCJuIjoiYWRtaW4iLCJpZCI6MX0="

export const config = {
    runtime: "edge",
  };

const handler = async (req: NextRequest) => {
  // Get datasource_id and prompt from the request body
  const { api_name, dashboard_name } = await req.json();
  if (api_name == "create_dashboard") {
    return create_dashboard(dashboard_name)
  }
};

async function create_dashboard(dashboard_name:string) {
    const url = grafanaUrl + '/api/dashboards/db';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + grafanaKey,
    };

    const newDashboard = {
        dashboard: {
          title: dashboard_name,
          panels: [
          ],
        },
        overwrite: false,
      };

    // Make a POST request to the external service
    const externalRes = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(newDashboard),
    });

    if (!externalRes.ok) {
        return new Response(externalRes.body, {
          status: externalRes.status,
          statusText: externalRes.statusText,
        });
    }

    const data = await externalRes.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    
}

export default handler;