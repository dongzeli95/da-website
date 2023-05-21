import { use, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import TextField from "./kit/TextField";
import Modal from "./kit/Modal";
import Icon from "./Icon";
import Select from "./kit/Select";
import useDarkMode from "@/hooks/useDarkmode";
import { CreatorRole } from "@/types";
import { generateUUID } from "@/utils";
import { useConversationStore, useConnectionStore, useMessageStore, useUserStore } from "@/store";

interface Props {
  deliveryCost?: {
    area: string;
    address: string;
    zipcode: string;
    residential: boolean;
    weight: number;
    notes: string;
  };
  close: () => void;
}

const areaOptions = [
  {
    label: "美中",
    value: "mid",
  },
  {
    label: "美西",
    value: "west",
  },
  {
    label: "美东",
    value: "east",
  },
];

const defaultDeliveryCost = {
  area: "west",
  address: "",
  zipcode: "",
  residential: false,
  weight: 0,
  notes: "",
};

const DeliveryCostModal = (props: Props) => {
  const { close } = props;
  const [deliveryCost, setDeliveryCost] = useState(defaultDeliveryCost);
  const [isRequesting, setIsRequesting] = useState(false);
  const messageStore = useMessageStore();
  const conversationStore = useConversationStore();
  const userStore = useUserStore();

  useEffect(() => {
    const cost = defaultDeliveryCost;
    setDeliveryCost(cost)
  }, []);

  const generateMessage = () => {
    const { area, address, zipcode, residential, weight, notes } = deliveryCost;
    const label = areaOptions.find((option) => option.value === area)?.label;
    const message = `${label}地区用户想寄送${weight}公斤包裹\n邮编: ${zipcode}\n住宅地址: ${residential ? "是" : "否"} \n备注: ${notes}`
    return message;
  };

  const handleEstimate = async () => {
    if (isRequesting) {
      return;
    }

    if (deliveryCost.zipcode === "") {
        toast.error("请输入邮编");
        return;
    }

    if (deliveryCost.weight === 0) {
        toast.error("请输入重量");
        return;
    }

    // if (deliveryCost.address === "") {
    //   toast.error("请输入地址");
    //   return;
    // }

    setIsRequesting(true);

    try {
        let conversation = conversationStore.currentConversation;
        if (!conversation) {
            return;
        }
        messageStore.addMessage({
        id: generateUUID(),
        conversationId: conversation.id,
        creatorId: userStore.currentUser.id,
        creatorRole: CreatorRole.User,
        createdAt: Date.now(),
        content: generateMessage(),
        status: "DONE",
        });

        let systemMessageId = generateUUID();
        messageStore.addMessage({
            id: systemMessageId,
            conversationId: conversation.id,
            creatorId: conversation.assistantId,
            creatorRole: CreatorRole.Assistant,
            createdAt: Date.now(),
            content: "",
            status: "LOADING",
        });
        // Network calls.
        const response = await fetch("/api/da", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            channel_id: conversation.id,
            api_name: "cost_estimate",
            area: deliveryCost.area,
            address: deliveryCost.address,
            zipcode: deliveryCost.zipcode,
            residential: deliveryCost.residential,
            weight: deliveryCost.weight,
            notes: deliveryCost.notes,
        }),
        });
        toast.success("发送估算请求成功");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save delivery cost");
    } finally {
      setIsRequesting(false);
    }
    close();
  };

  const isDarkMode = useDarkMode();

  return (
    <Modal title={"快递尾程成本计算"} onClose={close}>
      <div className="w-full flex flex-col justify-start items-start space-y-3 mt-2">
        <div className="w-full flex flex-col">
          <label className="block text-sm font-medium">地区</label>
          <Select
            className="w-full"
            value={deliveryCost.area}
            itemList={areaOptions}
            onValueChange={(value) =>
              setDeliveryCost({ ...deliveryCost, area: value })
            }
          />
        </div>
        <div className="w-full flex flex-col">
          <label className="block text-sm font-medium">邮编</label>
          <TextField
            value={deliveryCost.zipcode}
            onChange={(value) =>
              setDeliveryCost({ ...deliveryCost, zipcode: value })
            }
          />
        </div>
        <div className="w-full flex flex-col">
          <label className="block text-sm font-medium">重量(公斤)</label>
          <TextField
            value={deliveryCost.weight.toString()}
            onChange={(value) => {
                if (isNaN(parseFloat(value))) {
                    setDeliveryCost({
                    ...deliveryCost,
                    weight: 0,
                    });
                    return;
                }
              setDeliveryCost({
                ...deliveryCost,
                weight: parseFloat(value),
              })
            }
            }
          />
        </div>
        {/* <div className="w-full flex flex-col">
          <label className="block text-sm font-medium">地址</label>
          <TextField
            value={deliveryCost.address}
            onChange={(value) =>
              setDeliveryCost({ ...deliveryCost, address: value })
            }
          />
        </div> */}

        <div className="w-full flex flex-col">
          <div className="flex items-center">
            <label className="block text-sm font-medium mb-1 mr-2 flex-shrink-0">
              住宅地址
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                checked={deliveryCost.residential}
                onChange={(e) =>
                  setDeliveryCost({
                    ...deliveryCost,
                    residential: e.target.checked,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className={`w-full flex flex-col ${isDarkMode ? "dark" : ""}`}>
          <label className="block text-sm font-medium">
            备注 (附加费用信息)
          </label>
          <textarea
            value={deliveryCost.notes}
            onChange={(event) =>
              setDeliveryCost({ ...deliveryCost, notes: event.target.value })
            }
            className={`h-40 resize-y border rounded-md p-2 shadow ${
              isDarkMode ? "bg-zinc-800 text-white" : "bg-white text-gray-700"
            }`}
          />
        </div>
        {/* Add more fields as necessary */}
      </div>
      <div className="modal-action w-full flex flex-row justify-between items-center space-x-2 mt-4">
        <div className="space-x-2 flex flex-row justify-between">
          <button
            className="btn bg-indigo-600"
            style={{ backgroundColor: "#4F46E5" }}
            disabled={isRequesting}
            onClick={handleEstimate}
          >
            {isRequesting && (
              <Icon.BiLoaderAlt className="w-4 h-auto animate-spin mr-1" />
            )}
            估算
          </button>
          {/* <button className="btn btn-outline" onClick={close}>
            关闭
          </button> */}
        </div>
      </div>
    </Modal>
  );
};

export default DeliveryCostModal;
