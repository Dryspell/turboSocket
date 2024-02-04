import EmojiDisplay from "./EmojiDisplay";
import styles from "./styles.module.css";
import { Types } from "ably";
import { FaceSmileIcon } from "@heroicons/react/24/solid";
import { Message } from "~/types/chat";
import { ADD_REACTION_EVENT, emojis } from "../utils/constants";
import { sendMessageReaction } from "../utils/utils";

export default function EmojiReactionSelector(props: {
  setShowEmojiList: React.Dispatch<React.SetStateAction<boolean>>;
  showEmojiList: boolean;
  message: Message;
  channel: Types.RealtimeChannelPromise;
  clientId: string;
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  return (
    <div className={styles.controls}>
      <div className={styles.control}>
        <FaceSmileIcon
          className={styles.controlIcon}
          onClick={() => props.setShowEmojiList((prev) => !prev)}
        />
      </div>
      {props.showEmojiList ? (
        <ul className={styles.controlEmojiList}>
          {emojis.map((emoji) => (
            <li
              key={emoji}
              className={styles.controlEmojiListItem}
              onClick={() =>
                sendMessageReaction(
                  emoji,
                  props.message.id,
                  ADD_REACTION_EVENT,
                  props.channel,
                  props.setShowEmojiList,
                  props.clientId,
                  props.chatMessages,
                  props.setChatMessages,
                )
              }
            >
              <EmojiDisplay emoji={emoji} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
