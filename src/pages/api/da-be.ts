import { NextRequest } from "next/server";
import { getCookie, setCookie } from 'cookies-next';


export const config = {
    runtime: "edge",
  };

const baseUrl = process.env.DA_BE_URL;

const handler = async (req: NextRequest) => {
    // Rest of your code
    const { api_name, email, password, token } = await req.json();

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


export default handler;