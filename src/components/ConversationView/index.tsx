import { head, last } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  getAssistantById,
  getPromptGeneratorOfAssistant,
  useConversationStore,
  useMessageStore,
  useConnectionStore,
  useSettingStore,
  useLayoutStore,
  useGrafanaStore,
} from "@/store";
import { CreatorRole, Message } from "@/types";
import { countTextTokens, generateUUID } from "@/utils";
import Header from "./Header";
import EmptyView from "../EmptyView";
import MessageView from "./MessageView";
import MessageTextarea from "./MessageTextarea";
import DataStorageBanner from "../DataStorageBanner";
import GrafanaGraph from "./GrafanaGraph";
import { useRouter } from "next/router";
import { grafanaUrl } from "../constants";
import DeliveryCostModal from "../DeliveryCostModal";

// The maximum number of tokens that can be sent to the OpenAI API.
// reference: https://platform.openai.com/docs/api-reference/completions/create#completions/create-max_tokens
const MAX_TOKENS = 4000;

const ConversationView = () => {
  const settingStore = useSettingStore();
  const layoutStore = useLayoutStore();
  const connectionStore = useConnectionStore();
  const conversationStore = useConversationStore();
  const messageStore = useMessageStore();
  const grafanaStore = useGrafanaStore();
  const [isStickyAtBottom, setIsStickyAtBottom] = useState<boolean>(true);
  const [showHeaderShadow, setShowHeaderShadow] = useState<boolean>(false);
  const [showCostEstimator, toggleDeliveryCostModal] = useState<boolean>(false);
  const [costEstimationEnabled, setCostEstimationEnabled] = useState<boolean>(false);
  const conversationViewRef = useRef<HTMLDivElement>(null);
  const currentConversation = conversationStore.currentConversation;
  const messageList = messageStore.messageList.filter(
    (message) => message.conversationId === currentConversation?.id
  );
  const lastMessage = last(messageList);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    const getCostEstimationEnabled = async () => {
      const response = await fetch("/api/da-be", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_name: "cost_estimation_enabled",
          token: localStorage.getItem("token"),
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      console.log("cost estimation enabled: ", data)
      setCostEstimationEnabled(data);
    }

    getCostEstimationEnabled();
  }, []);

    useEffect(() => {
      let conversation = conversationStore.currentConversation;
      if (!conversation || !costEstimationEnabled) {
        return;
      }

      console.log("trigger sse again");
      const conversationId = conversation.id;
      const newSSE = !conversationStore.eventSourceExists(conversationId);
      const sse = conversationStore.getEventSource(conversation.id);
      console.log("sse: ", sse);
      if (newSSE) {
        sse.addEventListener("message", (event) => {
          const message = JSON.parse(event.data);
          console.log("message: ", message);
          // console.log(message.token);
          const messageList = messageStore
            .getState()
            .messageList.filter(
              (message) => message.conversationId === conversationId
            );
          const lastMessage = last(messageList);
          console.log("last message: ", lastMessage);
          if (!lastMessage) {
            return;
          }
          if (message.type != undefined && message.type === "end_stream") {
            console.log("end stream");
            var content = message.output;
            console.log("message content: ", content);
            // Fallback to last message content if no output is returned
            if (content == undefined || content === "") {
              content = lastMessage.content;
            }
            console.log("falback content: ", content);
            messageStore.updateMessage(lastMessage.id, {
              status: "DONE",
              content: content,
            });
            return;
          }

          const newMessage = lastMessage.content + message.token;
          messageStore.updateMessage(lastMessage.id, {
            status: "LOADING",
            content: newMessage,
          });
        });
      }
    }, [conversationStore.eventSourceMap, costEstimationEnabled]);

  const router = useRouter();

  const openFullGrafanaDashboard = () => {
    const dashboard_id = currentConversation?.dashboardId;
    const url = `/fullscreen-grafana-view?dashboard_id=${dashboard_id}`;
    const newTab = window.open(url, "_blank");
    if (newTab !== null) {
      newTab.focus();
    }
  };

  useEffect(() => {
    messageStore.messageList.map((message) => {
      if (message.status === "LOADING") {
        if (message.content === "") {
          messageStore.updateMessage(message.id, {
            content: "Failed to send the message.",
            status: "FAILED",
          });
        } else {
          messageStore.updateMessage(message.id, {
            status: "DONE",
          });
        }
      }
    });

    const handleConversationViewScroll = () => {
      if (!conversationViewRef.current) {
        return;
      }
      setShowHeaderShadow((conversationViewRef.current?.scrollTop || 0) > 0);
      setIsStickyAtBottom(
        conversationViewRef.current.scrollTop +
          conversationViewRef.current.clientHeight >=
          conversationViewRef.current.scrollHeight
      );
    };
    conversationViewRef.current?.addEventListener(
      "scroll",
      handleConversationViewScroll
    );

    return () => {
      conversationViewRef.current?.removeEventListener(
        "scroll",
        handleConversationViewScroll
      );
    };
  }, []);

  useEffect(() => {
    if (!conversationViewRef.current) {
      return;
    }
    conversationViewRef.current.scrollTop =
      conversationViewRef.current.scrollHeight;
  }, [currentConversation, lastMessage?.id]);

  useEffect(() => {
    if (!conversationViewRef.current) {
      return;
    }

    if (lastMessage?.status === "LOADING" && isStickyAtBottom) {
      conversationViewRef.current.scrollTop =
        conversationViewRef.current.scrollHeight;
    }
  }, [lastMessage?.status, lastMessage?.content, isStickyAtBottom]);

  useEffect(() => {
    if (
      currentConversation?.connectionId ===
        connectionStore.currentConnectionCtx?.connection.id &&
      currentConversation?.databaseName ===
        connectionStore.currentConnectionCtx?.database?.name
    ) {
      return;
    }

    // Auto select the first conversation when the current connection changes.
    const conversationList = conversationStore.conversationList.filter(
      (conversation) =>
        conversation.connectionId ===
          connectionStore.currentConnectionCtx?.connection.id &&
        conversation.databaseName ===
          connectionStore.currentConnectionCtx?.database?.name
    );
    conversationStore.setCurrentConversation(head(conversationList));
  }, [currentConversation, connectionStore.currentConnectionCtx]);

  const sendMessageToCurrentConversation = async () => {
    const currentConversation =
      conversationStore.getState().currentConversation;
    if (!currentConversation) {
      return;
    }
    if (lastMessage?.status === "LOADING") {
      return;
    }

    const messageList = messageStore
      .getState()
      .messageList.filter(
        (message) => message.conversationId === currentConversation.id
      );
    let prompt = "";
    let tokens = 0;

    const message: Message = {
      id: generateUUID(),
      conversationId: currentConversation.id,
      creatorId: currentConversation.assistantId,
      creatorRole: CreatorRole.Assistant,
      createdAt: Date.now(),
      content: "",
      status: "LOADING",
    };
    messageStore.addMessage(message);

    if (connectionStore.currentConnectionCtx?.database) {
      let schema = "";
      try {
        const tables = await connectionStore.getOrFetchDatabaseSchema(
          connectionStore.currentConnectionCtx?.database
        );
        for (const table of tables) {
          if (tokens < MAX_TOKENS / 2) {
            tokens += countTextTokens(schema + table.structure);
            schema += table.structure;
          }
        }
      } catch (error: any) {
        toast.error(error.message);
      }
      const promptGenerator = getPromptGeneratorOfAssistant(
        getAssistantById(currentConversation.assistantId)!
      );
      prompt = promptGenerator(schema);
    }
    let formatedMessageList = [];
    for (let i = messageList.length - 1; i >= 0; i--) {
      const message = messageList[i];
      if (tokens < MAX_TOKENS) {
        tokens += countTextTokens(message.content);
        formatedMessageList.unshift({
          role: message.creatorRole,
          content: message.content,
        });
      }
    }
    formatedMessageList.unshift({
      role: CreatorRole.System,
      content: prompt,
    });

    // const rawRes = await fetch("/api/chat", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     messages: formatedMessageList,
    //     openAIApiConfig: settingStore.setting.openAIApiConfig,
    //   }),
    // });

    // if (!rawRes.ok) {
    //   console.error(rawRes);
    //   let errorMessage = "Failed to request message, please check your network.";
    //   try {
    //     const res = await rawRes.json();
    //     errorMessage = res.error.message;
    //   } catch (error) {
    //     // do nth
    //   }
    //   messageStore.updateMessage(message.id, {
    //     content: errorMessage,
    //     status: "FAILED",
    //   });
    //   return;
    // }

    // const data = rawRes.body;
    // if (!data) {
    //   toast.error("No data return");
    //   return;
    // }

    // const reader = data.getReader();
    // const decoder = new TextDecoder("utf-8");
    // let done = false;
    // while (!done) {
    //   const { value, done: readerDone } = await reader.read();
    //   if (value) {
    //     const char = decoder.decode(value);
    //     if (char) {
    //       message.content = message.content + char;
    //       messageStore.updateMessage(message.id, {
    //         content: message.content,
    //       });
    //     }
    //   }
    //   done = readerDone;
    // }
    // messageStore.updateMessage(message.id, {
    //   status: "DONE",
    // });

    const datasource_id = currentConversation?.connectionId;
    const dashboard_id = currentConversation?.dashboardId;
    const prompt2 = messageList[messageList.length - 1];

    const response = await fetch("/api/da", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_name: "analyze",
        datasource_id,
        dashboard_id,
        prompt: prompt2.content,
        org_id: grafanaStore.currentOrganization?.orgId.toString(),
      }),
    });

    const data = await response.json();
    const url = grafanaUrl + data.url + "&auth_token=" + token;
    console.log("data: " + url);
    messageStore.updateMessage(message.id, {
      status: "DONE",
      content: url,
    });
  };

  return (
    <div
      ref={conversationViewRef}
      className={`${
        layoutStore.showSidebar && "sm:pl-80"
      } relative w-full h-full max-h-full flex flex-col justify-start items-start overflow-y-auto bg-white dark:bg-zinc-800`}
    >
      <div className="sticky top-0 z-1 bg-white dark:bg-zinc-800 w-full flex flex-col justify-start items-start">
        <DataStorageBanner />
        <Header className={showHeaderShadow ? "shadow" : ""} />
        <button
          className="w-full my-4 py-3 px-4 border dark:border-zinc-800 rounded-lg flex flex-row justify-center items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
          onClick={openFullGrafanaDashboard}
        >
          打开分析看板
        </button>
      </div>
      <div className="p-2 w-full h-auto grow max-w-4xl py-1 px-4 sm:px-8 mx-auto">
        {messageList.length === 0 ? (
          <EmptyView
            className="mt-16"
            sendMessage={sendMessageToCurrentConversation}
          />
        ) : (
          messageList.map(
            (message) =>
              message.content != undefined ? ( // Check if message.content exists
                message.content.startsWith("http") ? ( // Check if the message content starts with "http"
                  <GrafanaGraph key={message.id} url={message.content} />
                ) : (
                  <MessageView key={message.id} message={message} />
                )
              ) : null // Return null if message.content is undefined
          )
        )}
      </div>
      <div className="sticky bottom-0 w-full max-w-4xl py-2 px-4 sm:px-8 mx-auto bg-white dark:bg-zinc-800 bg-opacity-80 backdrop-blur">
        <MessageTextarea
          disabled={lastMessage?.status === "LOADING"}
          sendMessage={sendMessageToCurrentConversation}
          openCostEstimator={() => toggleDeliveryCostModal(true)}
        />
      </div>

      {showCostEstimator && (
        <DeliveryCostModal
          close={() => toggleDeliveryCostModal(false)}
        />
      )}
    </div>
  );
};

export default ConversationView;
