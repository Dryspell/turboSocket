interface EmojiUsage {
  emoji: string;
  usedBy: string[];
}

interface Message {
  author?: string;
  content?: string;
  timeserial?: string;
  reactions?: EmojiUsage[];
  timeStamp?: Date;
}
