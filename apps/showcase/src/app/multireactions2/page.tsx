"use client";

import { useAbly, useChannel } from "ably/react";
import { useEffect, useState } from "react";
import defaultMessages from "~/utils/messageData";
import { ArrowPathIcon, FaceSmileIcon } from "@heroicons/react/24/solid";
import { Types } from "ably";

import styles from "./styles.module.css";

const SEND_EVENT = "send";

export default function ChatBox({
  channelName,
  clientId,
}: {
  channelName: string;
  clientId: string;
}) {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const { channel } = useChannel(
    channelName,
    (msg: {
      name: string;
      data: { author: any; content: any; body: string };
      id: any;
      timestamp: string | number | Date;
      clientId: string;
    }) => {
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
          break;
      }
    },
  );

  useEffect(() => {
    // 💡 Keep last published message and reactions using Ably channel history 💡
    channel.history(
      (err: any, result: Types.PaginatedResult<Types.Message>) => {
        // Get index of last sent message from history
        const lastPublishedMessageIndex: any = result?.items.findIndex(
          (message) => message.name == SEND_EVENT,
        );

        if (lastPublishedMessageIndex >= 0) {
          updateMessageFromHistory(lastPublishedMessageIndex, result!);
        } else {
          // 💡 Load new random message when channel has no history 💡
          sendMessage();
        }
      },
    );
  }, []);

  // 💡 Publish new chat message to channel 💡
  const sendMessage = () => {
    const message =
      defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
    channel.publish(SEND_EVENT, message);
    console.log(`Sent message: ${message?.content}`);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.uiWrapper}>
          <div className={styles.instructions}>
            <p>
              Open this page in a few windows and add a reaction to the message
              to see it update everywhere.
            </p>
          </div>

          <ChatMessage channelName={channelName} clientId={clientId} />

          {/* Load new chat message */}
          <div className={styles.newMessage}>
            <button className={styles.newMessageButton} onClick={sendMessage}>
              <ArrowPathIcon className={styles.newMessageButtonIcon} />
              <span className={styles.newMessageButtonText}>New message</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
