"use client";

import { useAbly, useChannel } from "ably/react";
import { useEffect, useState } from "react";
import { ArrowPathIcon, FaceSmileIcon } from "@heroicons/react/24/solid";
import { Types } from "ably";
import styles from "./styles.module.css";
import ChatMessage from "./components/ChatMessage";
import { Box, Container } from "@mui/material";
import {
  sendMessage,
  updateEmojiCollection,
  updateMessageFromHistory,
} from "./utils/utils";
import { Message, MessageEvent, ReactionEvent } from "~/types/chat";

export const ADD_REACTION_EVENT = "add-reaction";
export const REMOVE_REACTION_EVENT = "remove-reaction";
export const SEND_EVENT = "send";

const chatBoxStyle = {
  margin: "auto",
  width: "600px",
  height: "600px",
  marginY: 2,
  overflowY: "auto",
  scrollbarWidth: "thin",
  "&::-webkit-scrollbar": {
    width: "0.4em",
  },
  "&::-webkit-scrollbar-track": {
    background: "#f1f1f1",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#888",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "#555",
  },
};

const Chat = ({
  channelName,
  clientId,
}: {
  channelName: string;
  clientId: string;
}) => {
  const client = useAbly();
  clientId = client?.auth.clientId || clientId;
  channelName = channelName || "chat";

  // 💡 Include your channel namespace created in Ably for message interactions. In this case, we use "reactions" 💡
  channelName = `trade:${channelName}`;

  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  // 💡 Access and subscribe to your channel using "useChannel" from "ably/react" 💡
  const { channel } = useChannel(
    channelName,
    (msg: MessageEvent | ReactionEvent) => {
      console.log(msg);
      switch (msg.name) {
        case SEND_EVENT:
          setChatMessages((chatMessages) => [
            ...chatMessages,
            {
              author: msg.data.author,
              content: msg.data.content,
              id: msg.id,
              timeStamp: new Date(msg.timestamp),
              reactions: [],
            },
          ]);
          break;
        case ADD_REACTION_EVENT:
        case REMOVE_REACTION_EVENT:
          // 💡 Remove emoji reaction from chat message 💡
          updateEmojiCollection(msg, chatMessages, setChatMessages);
          break;
      }
    },
  );

  useEffect(() => {
    // 💡 Keep last published message and reactions using Ably channel history 💡
    channel.history(
      (err: any, result: Types.PaginatedResult<Types.Message>) => {
        console.log(result);
        setChatMessages(
          result.items
            .filter((item) => item.data.author)
            .map((item) => ({
              author: item.data.author,
              content: item.data.content,
              id: item.id,
              reactions: [],
              timeStamp: new Date(item.timestamp || 0),
            })),
        );

        // Get index of last sent message from history
        const lastPublishedMessageIndex: any = result?.items.findIndex(
          (message) => message.name == SEND_EVENT,
        );

        if (lastPublishedMessageIndex >= 0) {
          updateMessageFromHistory(
            lastPublishedMessageIndex,
            result!,
            chatMessages,
            setChatMessages,
          );
        } else {
          // 💡 Load new random message when channel has no history 💡
          sendMessage(channel);
        }
      },
    );
  }, []);

  return (
    <Container
      sx={{
        alignItems: "center",
        marginY: 2,
      }}
    >
      <div className={styles.instructions}>
        <p>
          Open this page in a few windows and add a reaction to the message to
          see it update everywhere.
        </p>
      </div>
      <Box sx={chatBoxStyle}>
        {chatMessages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            clientId={clientId}
            channel={channel}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
          />
        ))}
      </Box>

      {/* Load new chat message */}
      <div className={styles.newMessage}>
        <button
          className={styles.newMessageButton}
          onClick={() => sendMessage(channel)}
        >
          <ArrowPathIcon className={styles.newMessageButtonIcon} />
          <span className={styles.newMessageButtonText}>New message</span>
        </button>
      </div>
    </Container>
  );
};

export default Chat;
