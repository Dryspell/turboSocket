"use client";

import { useAbly, useChannel } from "ably/react";
import { useEffect, useState } from "react";
import defaultMessages from "~/utils/messageData";
import { ArrowPathIcon, FaceSmileIcon } from "@heroicons/react/24/solid";
import { Types } from "ably";

import styles from "./styles.module.css";
import ChatMessage from "./ChatMessage";
import { Box, Container } from "@mui/material";

export const ADD_REACTION_EVENT = "add-reaction";
export const REMOVE_REACTION_EVENT = "remove-reaction";
export const SEND_EVENT = "send";

// 💡 Publish new chat message to channel 💡
const sendMessage = (channel: Types.RealtimeChannelPromise) => {
  const message =
    defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
  channel.publish(SEND_EVENT, message);
  console.log(`Sent message: ${message?.content}`);
};

// 💡 Keep track of used emojis 💡
export const updateEmojiCollection = (
  reaction: Reaction,
  chatMessages: Message[],
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) => {
  const targetMessage = chatMessages.find(
    (message) =>
      message.timeserial === reaction.data.extras.reference.timeserial,
  );
  if (!targetMessage) {
    console.error(
      `Message with timeserial ${reaction.data.extras.reference.timeserial} not found.`,
    );
    return;
  }
  const usedEmojiCollection = [...(targetMessage.reactions || [])];
  const userReactions = usedEmojiCollection.find(
    (emj) => emj.emoji === reaction.data.body,
  );

  switch (reaction.name) {
    case ADD_REACTION_EVENT:
      if (userReactions) {
        if (!userReactions.usedBy.includes(reaction.clientId)) {
          userReactions.usedBy.push(reaction.clientId);
        }
      } else {
        const emojiUse: EmojiUsage = {
          usedBy: [reaction.clientId],
          emoji: reaction.data.body,
        };
        usedEmojiCollection.push(emojiUse);
      }
      break;
    case REMOVE_REACTION_EVENT:
      if (userReactions && userReactions.usedBy.includes(reaction.clientId)) {
        userReactions.usedBy.splice(
          userReactions.usedBy.indexOf(reaction.clientId),
          1,
        );
        usedEmojiCollection[usedEmojiCollection.indexOf(userReactions)] =
          userReactions;
      }
      break;
  }
  setChatMessages((chatMessages) => [
    ...chatMessages.splice(0, chatMessages.indexOf(targetMessage)),
    {
      ...targetMessage,
      reactions: usedEmojiCollection,
    },
    ...chatMessages.splice(chatMessages.indexOf(targetMessage) + 1),
  ]);
};

// 💡 Update current chat message and its reactions leveraging Ably channel history 💡
const updateMessageFromHistory = (
  messageIndex: number,
  history: Types.PaginatedResult<Types.Message>,
  chatMessages: Message[],
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) => {
  const lastPublishedMessage = history?.items[messageIndex];

  // 💡 Get reactions of the published message 💡
  if (messageIndex > 0) {
    for (let i = messageIndex - 1; i >= 0; i--) {
      const emoji = history?.items[i]?.data.body;
      const client = history?.items[i]?.clientId;
      const event = history?.items[i]?.name;
      if (!emoji || !client || !event) continue;
      const targetMessage = chatMessages.find(
        (message) =>
          message.timeserial ===
          history?.items[i]?.data.extras.reference.timeserial,
      );
      if (!targetMessage) continue;

      if ((targetMessage?.reactions || []).length > 0) {
        for (const usage of targetMessage?.reactions!) {
          updateEmojiCollection(
            history?.items[i]!,
            chatMessages,
            setChatMessages,
          );
        }
      } else {
        updateEmojiCollection(
          history?.items[i]!,
          chatMessages,
          setChatMessages,
        );
      }
    }
  }
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
    (msg: {
      name: string;
      data: { author: any; content: any; body: string };
      id: any;
      timestamp: string | number | Date;
      clientId: string;
    }) => {
      console.log(msg);
      switch (msg.name) {
        case SEND_EVENT:
          setChatMessages((chatMessages) => [
            ...chatMessages,
            {
              author: msg.data.author,
              content: msg.data.content,
              timeserial: msg.id,
              timeStamp: new Date(msg.timestamp),
              reactions: [],
            },
          ]);
          break;

        case REMOVE_REACTION_EVENT:
          // 💡 Remove emoji reaction from chat message 💡
          updateEmojiCollection(
            //@ts-ignore
            msg,
            chatMessages,
            setChatMessages,
          );
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
              timeserial: item.id,
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
      <Box
        sx={{
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
        }}
      >
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
