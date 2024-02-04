import defaultMessages from "~/utils/messageData";
import { Types } from "ably";
import { EmojiUsage, Message, ReactionEvent } from "~/types/chat";
import { includes } from "~/types/utils";
import { ADD_REACTION_EVENT, REMOVE_REACTION_EVENT, SEND_EVENT } from "./constants";

// 💡 Publish new chat message to channel 💡
export const sendMessage = (
  channel: Types.RealtimeChannelPromise,
  message = defaultMessages[Math.floor(Math.random() * defaultMessages.length)],
) => {
  channel.publish(SEND_EVENT, message);
  console.log(`Sent message: ${message?.content}`);
};

// 💡 Keep track of used emojis 💡
export const updateEmojiCollection = (
  reaction: ReactionEvent,
  chatMessages: Message[],
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) => {
  const newChatMessages = [...chatMessages];
  const targetMessage = newChatMessages.find(
    (message) => message.id === reaction.data.extras.reference.timeserial,
  );
  if (!targetMessage) {
    console.error(
      `Message with timeserial ${reaction.data.extras.reference.timeserial} not found.`,
    );
    return;
  }
  const reactionsToThisEmoji = targetMessage.reactions.find(
    (emj) => emj.emoji === reaction.data.body,
  );

  addRemoveReactionByEvent(
    reaction.name,
    reaction.clientId,
    reaction.data.body,
    reactionsToThisEmoji,
    targetMessage,
  );
  setChatMessages((chatMessages) => newChatMessages);
};

const isReactionEvent = (event: Types.Message): event is ReactionEvent =>
  includes([ADD_REACTION_EVENT, REMOVE_REACTION_EVENT], event.name);

// 💡 Update current chat message and its reactions leveraging Ably channel history 💡
export const updateMessageFromHistory = (
  messageIndex: number,
  history: Types.PaginatedResult<Types.Message>,
  chatMessages: Message[],
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) => {
  const lastPublishedMessage = history?.items[messageIndex];

  // 💡 Get reactions of the published message 💡
  if (messageIndex > 0) {
    for (let i = messageIndex - 1; i >= 0; i--) {
      const reactionEvent = isReactionEvent(history?.items[i]!)
        ? history?.items[i]
        : null;
      if (!reactionEvent || !isReactionEvent(reactionEvent)) continue;

      const emoji = reactionEvent.data.body;
      const client = reactionEvent?.clientId;
      const event = reactionEvent?.name;
      if (!emoji || !client || !event) continue;

      const targetMessage = chatMessages.find(
        (message) =>
          message.id === reactionEvent?.data.extras.reference.timeserial,
      );
      if (!targetMessage) continue;

      if ((targetMessage?.reactions || []).length > 0) {
        for (const usage of targetMessage?.reactions!) {
          updateEmojiCollection(reactionEvent, chatMessages, setChatMessages);
        }
      } else {
        updateEmojiCollection(reactionEvent, chatMessages, setChatMessages);
      }
    }
  }
};

export const addRemoveReactionByEvent = (
  eventType: typeof ADD_REACTION_EVENT | typeof REMOVE_REACTION_EVENT,
  clientId: string,
  emoji: string,
  reactionsToThisEmoji: EmojiUsage | undefined,
  targetMessage: Message,
) => {
  switch (eventType) {
    case ADD_REACTION_EVENT:
      if (reactionsToThisEmoji) {
        if (!reactionsToThisEmoji.usedBy.includes(clientId)) {
          reactionsToThisEmoji.usedBy.push(clientId);
        }
      } else {
        targetMessage.reactions.push({
          usedBy: [clientId],
          emoji,
        });
      }
      break;
    case REMOVE_REACTION_EVENT:
      if (
        reactionsToThisEmoji &&
        reactionsToThisEmoji.usedBy.includes(clientId)
      ) {
        reactionsToThisEmoji.usedBy.splice(
          reactionsToThisEmoji.usedBy.indexOf(clientId),
          1,
        );
      }
      break;
  }
};


// 💡 Format chat message timestamp to readable format 💡
export const formatChatMessageTime = (timestamp: Date) => {
  const hour = timestamp.getHours();
  const minutes = `${
    timestamp.getMinutes() < 10 ? "0" : ""
  }${timestamp.getMinutes()}`;
  return `${hour}:${minutes}`;
};

// 💡 Publish emoji reaction for a message using the chat message timeserial 💡
export const sendMessageReaction = (
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
  } as ReactionEvent;
  channel.publish(reactionEventType, reactionEvent.data);
  setShowEmojiList((prev) => false);
  updateEmojiCollection(reactionEvent, chatMessages, setChatMessages);

  console.log(`${reactionEventType}: ${emoji}`);
};