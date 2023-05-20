import dayjs from "dayjs";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Conversation, Id } from "@/types";
import { generateUUID } from "@/utils";

const getDefaultConversation = (): Conversation => {
  return {
    id: generateUUID(),
    assistantId: "sql-assistant",
    title: dayjs().format("LTS"),
    createdAt: Date.now(),
    dashboardId: "",
  };
};

interface ConversationState {
  getState: () => ConversationState;
  conversationList: Conversation[];
  eventSourceMap: { [conversationId: string]: EventSource };
  currentConversation?: Conversation;
  getEventSource: (conversationId: Id) => EventSource;
  eventSourceExists: (conversationId: Id) => boolean; 
  createConversation: (dashboardId:string, connectionId?: Id, databaseName?: string) => Conversation;
  setCurrentConversation: (Conversation: Conversation | undefined) => void;
  getConversationById: (conversationId: Id) => Conversation | undefined;
  updateConversation: (conversationId: Id, conversation: Partial<Conversation>) => void;
  clearConversation: (filter: (conversation: Conversation) => boolean) => void;
}

// const baseURL = "http://127.0.0.1:5000/v1/stream_gpt"
const baseURL =
  "https://da-service-dev-6039-4-1313827042.sh.run.tcloudbase.com/v1/stream_gpt";

const isEmpty = (obj: Object) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

type StoreSet = (partial: Partial<ConversationState> | ((state: ConversationState) => Partial<ConversationState>), replace?: boolean) => void;

function createEventSource(conversationId: Id, storeSet: StoreSet) {
  let es = new EventSource(`${baseURL}/${conversationId}`);

  // Listen for error event
  es.onerror = (err) => {
    console.error("EventSource failed:", err);
    // Close the current connection
    es.close();

    // Set a timeout to reconnect after the delay
    setTimeout(() => {
      // Replace the EventSource in the eventSourceMap
      storeSet((state) => {
          const {[conversationId]: removed, ...rest} = state.eventSourceMap;

          // Create a new object
          const newEventSourceMap = { ...rest };

          return {
              ...state,
              eventSourceMap: newEventSourceMap,
          };
      });
    });
  };

  return es;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      getState: () => get(),
      conversationList: [],
      eventSourceMap: {},
      getEventSource: (conversationId: Id) => {
        console.log("conversationId: ", conversationId)
        if (!get().eventSourceMap[conversationId] || isEmpty(get().eventSourceMap[conversationId])) {
          console.log("create a new event source here")
          const es = createEventSource(conversationId, set);
          set((state) => ({
              ...state,
              eventSourceMap: {
                ...state.eventSourceMap,
                [conversationId]: es,
              },
          }));
          console.log("return es: ", es)
          return es;
        }

        const res = get().eventSourceMap[conversationId]

        console.log("return existing event source here")
        console.log(res)
        return res
      },
      eventSourceExists: (conversationId: Id) => {
        return get().eventSourceMap[conversationId] !== undefined && !isEmpty(get().eventSourceMap[conversationId])
      },
      createConversation: ( dashboardId: string, connectionId?: Id, databaseName?: string) => {
        const conversation: Conversation = {
          ...getDefaultConversation(),
          connectionId,
          databaseName,
          dashboardId,
        };
        set((state) => ({
          conversationList: [...state.conversationList, conversation],
          currentConversation: conversation,
        }));
        return conversation;
      },
      setCurrentConversation: (conversation: Conversation | undefined) => set(() => ({ currentConversation: conversation })),
      getConversationById: (conversationId: Id) => {
        return get().conversationList.find((item) => item.id === conversationId);
      },
      updateConversation: (conversationId: Id, conversation: Partial<Conversation>) => {
        set((state) => ({
          ...state,
          conversationList: state.conversationList.map((item) => (item.id === conversationId ? { ...item, ...conversation } : item)),
        }));
      },
      clearConversation: (filter: (conversation: Conversation) => boolean) => {
        set((state) => ({
          ...state,
          conversationList: state.conversationList.filter(filter),
        }));
      },
    }),
    {
      name: "conversation-storage",
    }
  )
);
