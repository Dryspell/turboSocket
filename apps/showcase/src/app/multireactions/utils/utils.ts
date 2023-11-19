import defaultMessages from "~/utils/messageData";
import { ADD_REACTION_EVENT, REMOVE_REACTION_EVENT, SEND_EVENT } from "../page";
import { Types } from "ably";
import { EmojiUsage, Message, ReactionEvent } from "~/types/chat";

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
      const emoji = history?.items[i]?.data.body;
      const client = history?.items[i]?.clientId;
      const event = history?.items[i]?.name;
      if (!emoji || !client || !event) continue;
      const targetMessage = chatMessages.find(
        (message) =>
          message.id === history?.items[i]?.data.extras.reference.timeserial,
      );
      if (!targetMessage) continue;

      if ((targetMessage?.reactions || []).length > 0) {
        for (const usage of targetMessage?.reactions!) {
          updateEmojiCollection(
            history?.items[i]!,
            chatMessages,
            setChatMessages,
          );
        }
      } else {
        updateEmojiCollection(
          history?.items[i]!,
          chatMessages,
          setChatMessages,
        );
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
