import { useEffect, useState } from "react";
import EmojiDisplay from "./EmojiDisplay";
import styles from "./styles.module.css";
import { Types } from "ably";
import {
  ADD_REACTION_EVENT,
  REMOVE_REACTION_EVENT,
  updateEmojiCollection,
} from "./page";
import { FaceSmileIcon } from "@heroicons/react/24/solid";
import { useChannel } from "ably/react";

const emojis = ["😀", "❤️", "👋", "😹", "😡", "👏"];

// 💡 Format chat message timestamp to readable format 💡
const formatChatMessageTime = (timestamp: Date) => {
  const hour = timestamp.getHours();
  const minutes = `${
    timestamp.getMinutes() < 10 ? "0" : ""
  }${timestamp.getMinutes()}`;
  return `${hour}:${minutes}`;
};

// 💡 Increase or decrease emoji count on click on existing emoji 💡
const handleEmojiCount = (
  emoji: string,
  timeserial: any,
  addEmoji: boolean,
  setAddEmoji: React.Dispatch<React.SetStateAction<boolean>>,
  channel: Types.RealtimeChannelPromise,
  setShowEmojiList: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const emojiEvent = addEmoji ? ADD_REACTION_EVENT : REMOVE_REACTION_EVENT;
  setAddEmoji(!addEmoji);
  sendMessageReaction(emoji, timeserial, emojiEvent, channel, setShowEmojiList);
};

// 💡 Publish emoji reaction for a message using the chat message timeserial 💡
const sendMessageReaction = (
  emoji: string,
  timeserial: any,
  reactionEvent: string,
  channel: Types.RealtimeChannelPromise,
  setShowEmojiList: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  channel.publish(reactionEvent, {
    body: emoji,
    extras: {
      reference: { type: "com.ably.reaction", timeserial },
    },
  });
  setShowEmojiList(false);
  console.log(`Sent reaction: ${emoji}`);
};

export default function ChatMessage(props: {
  message: Message;
  clientId: string;
  channel: ReturnType<typeof useChannel>["channel"];
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const { message, clientId, channel, chatMessages, setChatMessages } = props;

  const [addEmoji, setAddEmoji] = useState(true);
  const [showEmojiList, setShowEmojiList] = useState(false);

  // 💡 Subscribe to emoji reactions for a message using the message timeserial 💡
  const getMessageReactions = () => {
    channel.subscribe(
      {
        name: ADD_REACTION_EVENT,
        refTimeserial: message.timeserial,
      },
      (reaction: {
        data: {
          body: string;
          extras: {
            reference: { type: "com.ably.reaction"; timeserial: string };
          };
        };
        clientId: string;
        name: string;
      }) => {
        console.log({ reaction });
        // 💡 Update current chat message with its reaction(s)💡

        updateEmojiCollection(reaction, chatMessages, setChatMessages);
      },
    );
  };

  useEffect(() => {
    getMessageReactions();
  }, []);

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
                  onClick={() =>
                    handleEmojiCount(
                      reaction.emoji,
                      message.timeserial,
                      addEmoji,
                      setAddEmoji,
                      channel,
                      setShowEmojiList,
                    )
                  }
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
              onClick={() => setShowEmojiList(!showEmojiList)}
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
                      message.timeserial,
                      ADD_REACTION_EVENT,
                      channel,
                      setShowEmojiList,
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
