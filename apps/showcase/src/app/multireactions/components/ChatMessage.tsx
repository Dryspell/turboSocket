import { useState } from "react";
import EmojiDisplay from "./EmojiDisplay";
import styles from "../styles.module.css";
import { ADD_REACTION_EVENT, REMOVE_REACTION_EVENT } from "../page";
import { useChannel } from "ably/react";
import { Message } from "~/types/chat";
import { formatChatMessageTime, sendMessageReaction } from "../utils/utils";
import EmojiReactionSelector from "./EmojiReactionSelector";

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
        <EmojiReactionSelector
          setShowEmojiList={setShowEmojiList}
          showEmojiList={showEmojiList}
          message={message}
          channel={channel}
          clientId={clientId}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
        />
      </div>
    </div>
  );
}
