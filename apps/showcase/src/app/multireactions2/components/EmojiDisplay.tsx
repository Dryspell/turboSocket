import Image from "next/image";
import styles from "../styles.module.css";

// 💡 Use twemoji for consistency in emoji display across platforms 💡
export default function EmojiDisplay({ emoji }: { emoji: string }) {
  const codePoint = emoji.codePointAt(0)?.toString(16);
  return (
    <Image
      alt={emoji}
      className={styles.emojiIcon}
      height={24}
      width={24}
      src={`https://twemoji.maxcdn.com/v/latest/svg/${codePoint}.svg`}
    />
  );
}
