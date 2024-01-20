import { NextResponse } from "next/server";
import { env } from "~/env.mjs";
import { AblyTokenResponse } from "~/types/ably";
// import { currentUser } from "@clerk/nextjs/server";

export const runtime = "edge";

async function handler(request: Request) {
  if (!env.ABLY_API_KEY) {
    return new Response(
      `Missing ABLY_API_KEY environment variable.
                If you're running locally, please ensure you have a ./.env file with a value for ABLY_API_KEY=your-key.
                If you're running in Netlify, make sure you've configured env variable ABLY_API_KEY. 
                Please see README.md for more details on configuring your Ably API Key.`,
      {
        status: 500,
        statusText: `Missing ABLY_API_KEY environment variable.
        If you're running locally, please ensure you have a ./.env file with a value for ABLY_API_KEY=your-key.
        If you're running in Netlify, make sure you've configured env variable ABLY_API_KEY. 
        Please see README.md for more details on configuring your Ably API Key.`,
      },
    );
  }

  const keyName = env.ABLY_API_KEY.split(":")[0];

  const { searchParams } = new URL(request.url);
  const user = {
    id: `${
      searchParams.get("user") ||
      `Anonymous ${Math.random().toString().substring(2, 15)}`
    }`,
  };
  console.log(`Authorizing Ably token request for user ${user?.id}`);

  const tokenResponse = await fetch(
    `https://rest.ably.io/keys/${keyName}/requestToken`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(env.ABLY_API_KEY)}`,
      },
      body: JSON.stringify({
        keyName,
        clientId: user?.id,
        timestamp: Date.now(),
      }),
    },
  );
  const tokenResponseData = (await tokenResponse.json()) as AblyTokenResponse;

  return NextResponse.json(tokenResponseData, {
    status: 200,
    statusText: "SUCCESS",
  });
}

export { handler as POST, handler as GET };
