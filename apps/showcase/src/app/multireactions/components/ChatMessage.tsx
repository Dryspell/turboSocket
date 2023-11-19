import { useState } from "react";
import EmojiDisplay from "./EmojiDisplay";
import styles from "../styles.module.css";
import { Types } from "ably";
import { ADD_REACTION_EVENT, REMOVE_REACTION_EVENT } from "../page";
import { FaceSmileIcon } from "@heroicons/react/24/solid";
import { useChannel } from "ably/react";
import { Message } from "~/types/chat";
import {
  addRemoveReactionByEvent,
  updateEmojiCollection,
} from "../utils/utils";

const emojis = ["😀", "❤️", "👋", "😹", "😡", "👏"];

// 💡 Format chat message timestamp to readable format 💡
const formatChatMessageTime = (timestamp: Date) => {
  const hour = timestamp.getHours();
  const minutes = `${
    timestamp.getMinutes() < 10 ? "0" : ""
  }${timestamp.getMinutes()}`;
  return `${hour}:${minutes}`;
};

// 💡 Publish emoji reaction for a message using the chat message timeserial 💡
const sendMessageReaction = (
  emoji: string,
  timeserial: string,
  reactionEventType: typeof ADD_REACTION_EVENT | typeof REMOVE_REACTION_EVENT,
  channel: Types.RealtimeChannelPromise,
  setShowEmojiList: React.Dispatch<React.SetStateAction<boolean>>,
  clientId: string,
  chatMessages: Message[],
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) => {
  const reactionEvent = {
    name: reactionEventType,
    clientId,
    data: {
      body: emoji,
      extras: {
        reference: { type: "com.ably.reaction" as const, timeserial },
      },
    },
  };
  channel.publish(reactionEventType, reactionEvent.data);
  setShowEmojiList((prev) => false);
  updateEmojiCollection(reactionEvent, chatMessages, setChatMessages);

  console.log(`${reactionEventType}: ${emoji}`);
};

export default function ChatMessage(props: {
  message: Message;
  clientId: string;
  channel: ReturnType<typeof useChannel>["channel"];
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const { message, clientId, channel, chatMessages, setChatMessages } = props;

  const [showEmojiList, setShowEmojiList] = useState(false);

  return (
    <div className={styles.author}>
      <div className={styles.authorFlex}>
        <img className={styles.authorAvatar} role="presentation"></img>
        <div>
          <p className={styles.authorName}>
            {message.author}
            <span className={styles.authorTimestamp}>
              {formatChatMessageTime(message.timeStamp!)}
            </span>
          </p>
          <p className={styles.message}>{message.content}</p>
        </div>
      </div>

      {/* Display chat message emoji reactions and count */}
      <div className={styles.emojiWrapper}>
        {message.reactions?.length ? (
          <ul className={styles.emojiList}>
            {message.reactions?.map((reaction) =>
              reaction.usedBy.length ? (
                <li
                  key={reaction.emoji}
                  className={`${styles.emojiListItem} ${
                    reaction.usedBy.includes(clientId)
                      ? styles.emojiListItemBlue
                      : styles.emojiListItemSlate
                  }`}
                  onClick={() => {
                    const reactionEventType = reaction.usedBy.includes(clientId)
                      ? REMOVE_REACTION_EVENT
                      : ADD_REACTION_EVENT;
                    sendMessageReaction(
                      reaction.emoji,
                      message.id,
                      reactionEventType,
                      channel,
                      setShowEmojiList,
                      clientId,
                      chatMessages,
                      setChatMessages,
                    );
                  }}
                >
                  <EmojiDisplay emoji={reaction.emoji} />
                  <span className={styles.emojiListItemSpan}>
                    {reaction.usedBy.length}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        ) : null}

        {/* Allow user to select and add an emoji reaction */}
        <div className={styles.controls}>
          <div className={styles.control}>
            <FaceSmileIcon
              className={styles.controlIcon}
              onClick={() => setShowEmojiList((prev) => !prev)}
            />
          </div>
          {showEmojiList ? (
            <ul className={styles.controlEmojiList}>
              {emojis.map((emoji) => (
                <li
                  key={emoji}
                  className={styles.controlEmojiListItem}
                  onClick={() =>
                    sendMessageReaction(
                      emoji,
                      message.id,
                      ADD_REACTION_EVENT,
                      channel,
                      setShowEmojiList,
                      clientId,
                      chatMessages,
                      setChatMessages,
                    )
                  }
                >
                  <EmojiDisplay emoji={emoji} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
