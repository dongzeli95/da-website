import { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import Script from "next/script";
import React from "react";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { useConnectionStore, useGrafanaStore } from "@/store";

// Use dynamic import to avoid page hydrated.
// reference: https://github.com/pmndrs/zustand/issues/1145#issuecomment-1316431268
const ConnectionSidebar = dynamic(
  () => import("@/components/ConnectionSidebar"),
  {
    ssr: false,
  }
);
const ConversationView = dynamic(
  () => import("@/components/ConversationView"),
  {
    ssr: false,
  }
);
const QueryDrawer = dynamic(() => import("@/components/QueryDrawer"), {
  ssr: false,
});

const LoginView = dynamic(() => import("@/components/LoginView"), {
  ssr: false,
});

const IndexPage: NextPage = () => {
  const [isValidAuth, setIsValidAuth] = useState(false);
  const grafanaStore = useGrafanaStore();
  const connectionStore = useConnectionStore();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Check if the token exists and is valid
    // You should also verify the token on the server-side to prevent attacks
    if (!token) {
      return;
    }

    const verify_token = async () => {
      try {
        const response = await fetch("/api/da-be", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_name: "verify_token",
            token: localStorage.getItem("token"),
          }),
        });

        setIsValidAuth(response.ok);
        if (response.ok) {
          await fetchData();
        }
      } catch (error) {}
    };

    verify_token();
  }, []);

  const fetchData = async function () {
    await Promise.all([
      grafanaStore.fetchOrganizations(),
      connectionStore.fetchConnections(),
    ]).finally(() => {});
  };

  const handleLogin = async () => {
    setIsValidAuth(true);
    await fetchData();
  };

  const handleLogout = () => {
    setIsValidAuth(false);
  };

  return (
    <div>
      <Head>
        <title>
          DA Chat - Chat-based Data Analysis client for the next decade
        </title>
        {/* <link rel="icon" href="/chat-logo-bot.webp" /> */}
        <meta
          name="description"
          content="DA Chat - Chat-based Data Analysis client for the next decade"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="og:title" property="og:title" content="DA Chat" />
        <meta
          name="og:description"
          property="og:description"
          content="DA Chat - Chat-based Data Analysis client for the next decade"
        />
        <meta
          name="og:image"
          property="og:image"
          content="https://www.sqlchat.ai/chat-logo-and-text.webp"
        />
        <meta name="og:type" property="og:type" content="website" />
        <meta
          name="og:url"
          property="og:url"
          content="https://www.sqlchat.ai"
        />
      </Head>

      <h1 className="sr-only">DA Chat</h1>

      {isValidAuth ? (
        <main className="w-full h-full flex flex-row dark:bg-zinc-800">
          <ConnectionSidebar onLogout={handleLogout} />
          <ConversationView />
        </main>
      ) : (
        <LoginView onLogin={handleLogin} />
      )}

      <Script
        defer
        data-domain="sqlchat.ai"
        src="https://plausible.io/js/script.js"
      />
    </div>
  );
};

export default IndexPage;
