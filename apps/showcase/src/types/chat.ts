import { Types } from "ably";
import { ADD_REACTION_EVENT, REMOVE_REACTION_EVENT, SEND_EVENT } from "~/app/multireactions/page";

export type EmojiUsage = {
  emoji: string;
  usedBy: string[];
}

export type Message = {
  author: string;
  content: string;
  id: string;
  reactions: EmojiUsage[];
  timeStamp: Date;
}

export type MessageEvent = {
  name: typeof SEND_EVENT;
  data: { author: string; content: string };
  id: any;
  timestamp: string | number | Date;
  clientId: string;
  connectionId: string;
};

export interface ReactionEvent extends Types.Message {
  data: {
    body: string;
    extras: {
      reference: { type: "com.ably.reaction"; timeserial: string };
    };
  };
  clientId: string;
  name: typeof ADD_REACTION_EVENT | typeof REMOVE_REACTION_EVENT;
}
