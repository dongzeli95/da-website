import { NextRequest } from "next/server";
import { Connection, toGrafanaType } from "@/types";

export const config = {
    runtime: "edge",
  };

const baseUrl = process.env.DA_BE_URL;

const handler = async (req: NextRequest) => {
    // Rest of your code
    const { api_name, email, password, token, connection } = await req.json();

    if (api_name === "login") {
      return login(email, password)
    } else if (api_name === "signup") {
      return signup(email, password)
    } else if (api_name === "verify_token") {
      if (!token || !verifyToken(token)) {
        return new Response(JSON.stringify({ error: "No token" }), { status: 401 })
      }

      return new Response(JSON.stringify({ message: "Token verified" }), { status: 200 })
    } else if (api_name === "change_password") {
        return changePassword(email, password)
    } else if (api_name === "send_email") {
      const code = await sendEmail(email)
      if (code === undefined || code.length === 0) {
        return new Response(JSON.stringify({ error: "No code" }), { status: 401 })
      }

      return new Response(JSON.stringify({ code }), { status: 200 })
    } else if (api_name === "add_datasource") {
      const conn = connection as Connection;
      return addDatasource(token, conn)
    } else if (api_name === "get_datasources") {
      console.log("called get data sources: " , token)
      return getDatasources(token)
    } else if (api_name === "create_dashboard") {
      return createGrafanaDashboard(token)
    } else if (api_name === "get_user_organizations") {
      return getUserOrganizations(token)
    } else if (api_name === "cost_estimation_enabled") {
      return costEstimationEnabled(token)
    }
  };

async function login(email: string, password: string) {
  const response = await fetch(`${baseUrl}/v1/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return response
}

async function signup(email: string, password: string) {
  const response = await fetch(`${baseUrl}/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return response
}

async function changePassword(email: string, password: string) {
    const response = await fetch(`${baseUrl}/v1/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  
    return response
}

async function verifyToken(token: string) {
  const response = await fetch(`${baseUrl}/v1/verify-token`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
  });

  return response.ok
}

async function sendEmail(email: string) : Promise<string>{
  const params = new URLSearchParams();
  params.append('email', email);
  const response = await fetch(`${baseUrl}/v1/email?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const res = await response.json()
  return res
}


async function getDatasources(token: string) {
  const response = await fetch(`${baseUrl}/v1/grafana/datasource`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
  });

  return response
}

async function addDatasource(token: string, connection: Connection) {
  const response = await fetch(`${baseUrl}/v1/grafana/datasource`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({
      name: connection.title,
      dsType: toGrafanaType(connection.engineType),
      url: connection.host + ":" + connection.port,
      dbName: connection.database,
      user: connection.username,
      password: connection.password,
    }),
  });

  return response
}

async function createGrafanaDashboard(token: string) {
  const response = await fetch(`${baseUrl}/v1/grafana/dashboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
  });

  return response
}

async function getUserOrganizations(token: string) {
  const response = await fetch(`${baseUrl}/v1/grafana/user/organizations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
  });

  return response
}

async function costEstimationEnabled(token: string) {
  const response = await fetch(`${baseUrl}/v1/cost_estimation_enabled`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
  });

  return response
}



export default handler;