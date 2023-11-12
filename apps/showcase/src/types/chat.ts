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

interface Reaction {
  data: {
    body: string;
    extras: {
      reference: { type: "com.ably.reaction"; timeserial: string };
    };
  };
  clientId: string;
  name: string;
}
