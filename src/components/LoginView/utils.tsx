export async function sendEmail(email: string) : Promise<string>{
  const response = await fetch("/api/da-be", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ "api_name": "send_email", "email": email}),
  });

  if (!response.ok) {
    return ""
  }
  
  const res = await response.json();
  if (res === undefined) {
    return ""
  }

  return res.code ?? "";
}