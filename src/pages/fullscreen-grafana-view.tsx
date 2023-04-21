// pages/fullscreen-graph.tsx
import { NextPage } from "next";
import Head from "next/head";
import React from "react";
import GrafanaFullDash from "@/components/GrafanaFullDash";
import { useRouter } from "next/router";


const FullScreenGraphPage: NextPage = () => {
    const router = useRouter();
    const dashboard_id = router.query.dashboard_id as string;
  return (
    <div>
      <Head>
        <title>分析看板</title>
        <meta name="description" content="Fullscreen Grafana Dashboard" />
        {/* Add any additional meta tags or link tags here */}
      </Head>

      <h1 className="sr-only">分析看板</h1>

      <main className="w-full h-full">
        <GrafanaFullDash dashboard_id={dashboard_id} />
      </main>
    </div>
  );
};

export default FullScreenGraphPage;
