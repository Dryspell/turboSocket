"use client";

import { useAbly, useChannel } from "ably/react";
import { useEffect, useState } from "react";
import defaultMessages from "~/utils/messageData";
import { ArrowPathIcon, FaceSmileIcon } from "@heroicons/react/24/solid";
import { Types } from "ably";

import styles from "./styles.module.css";
import ChatMessage from "./ChatMessage";

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
const updateEmojiCollection = (
  emoji: string,
  clientId: string,
  reactionEvent: string,
  usedEmojiCollection: EmojiUsage[],
) => {
  const userReactions = usedEmojiCollection.find((emj) => emj.emoji === emoji);

  switch (reactionEvent) {
    case ADD_REACTION_EVENT:
      if (userReactions) {
        if (!userReactions.usedBy.includes(clientId)) {
          userReactions.usedBy.push(clientId);
        }
      } else {
        const emojiUse: EmojiUsage = { usedBy: [clientId], emoji: emoji };
        usedEmojiCollection.push(emojiUse);
      }
      break;
    case REMOVE_REACTION_EVENT:
      if (userReactions && userReactions.usedBy.includes(clientId)) {
        userReactions.usedBy.splice(userReactions.usedBy.indexOf(clientId), 1);
        usedEmojiCollection[usedEmojiCollection.indexOf(userReactions)] =
          userReactions;
      }
      break;
  }
  return usedEmojiCollection;
};

// 💡 Update current chat message and its reactions leveraging Ably channel history 💡
const updateMessageFromHistory = (
  messageIndex: number,
  history: Types.PaginatedResult<Types.Message>,
  setChatMessage: React.Dispatch<React.SetStateAction<Message>>,
  usedEmojiCollection: EmojiUsage[],
) => {
  const lastPublishedMessage = history?.items[messageIndex];

  // 💡 Get reactions of the published message 💡
  if (messageIndex > 0) {
    for (let i = messageIndex - 1; i >= 0; i--) {
      const emoji = history?.items[i]?.data.body;
      const client = history?.items[i]?.clientId;
      const event = history?.items[i]?.name;
      if (!emoji || !client || !event) continue;

      if (usedEmojiCollection.length > 0) {
        for (const usage of usedEmojiCollection) {
          updateEmojiCollection(emoji, client, event, usedEmojiCollection);
        }
      } else {
        const emojiUse: EmojiUsage = { usedBy: [client], emoji: emoji };
        usedEmojiCollection.push(emojiUse);
      }
    }
  }

  // 💡 Update chat message 💡
  setChatMessage({
    author: lastPublishedMessage?.data.author,
    content: lastPublishedMessage?.data.content,
    timeserial: lastPublishedMessage?.id,
    reactions: usedEmojiCollection,
    timeStamp: new Date(lastPublishedMessage?.timestamp || 0),
  });
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
  let usedEmojiCollection: EmojiUsage[] = [];

  const [chatMessage, setChatMessage] = useState<Message>({});

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
            },
          ]);

          // 💡 Reset emoji reactions when a new message is received 💡
          usedEmojiCollection = [];
          setChatMessage({
            author: msg.data.author,
            content: msg.data.content,
            timeserial: msg.id,
            timeStamp: new Date(msg.timestamp),
          });
          break;
        case REMOVE_REACTION_EVENT:
          // 💡 Remove emoji reaction from chat message 💡
          const msgReactions = updateEmojiCollection(
            msg.data.body,
            msg.clientId,
            msg.name,
            usedEmojiCollection,
          );
          setChatMessage((chatMessage) => ({
            ...chatMessage,
            reactions: msgReactions,
          }));
          break;
      }
    },
  );

  // 💡 Subscribe to emoji reactions for a message using the message timeserial 💡
  const getMessageReactions = () => {
    channel.subscribe(
      {
        name: ADD_REACTION_EVENT,
        refTimeserial: chatMessage.timeserial,
      },
      (reaction: {
        data: { body: string };
        clientId: string;
        name: string;
      }) => {
        // 💡 Update current chat message with its reaction(s) 💡
        const msgReactions = updateEmojiCollection(
          reaction.data.body,
          reaction.clientId,
          reaction.name,
          usedEmojiCollection,
        );
        setChatMessage((chatMessage) => ({
          ...chatMessage,
          reactions: msgReactions,
        }));
      },
    );
  };

  useEffect(() => {
    // 💡 Subscribe to message reactions 💡
    getMessageReactions();

    // 💡 Keep last published message and reactions using Ably channel history 💡
    channel.history(
      (err: any, result: Types.PaginatedResult<Types.Message>) => {
        console.log(result);
        setChatMessages(
          result.items.map((item) => ({
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
            setChatMessage,
            usedEmojiCollection,
          );
        } else {
          // 💡 Load new random message when channel has no history 💡
          sendMessage(channel);
        }
      },
    );
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.uiWrapper}>
        <div className={styles.instructions}>
          <p>
            Open this page in a few windows and add a reaction to the message to
            see it update everywhere.
          </p>
        </div>

        {/* Display default chat message */}
        {chatMessage.author ? (
          <ChatMessage
            message={chatMessage}
            clientId={clientId}
            channel={channel}
          />
        ) : null}

        {chatMessages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            clientId={clientId}
            channel={channel}
          />
        ))}

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
      </div>
    </div>
  );
};

export default Chat;
