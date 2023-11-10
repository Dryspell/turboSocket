import { BetterEnum } from "~/utils/helpers";

export type AblyTokenResponse = {
  token: string;
  issued: number;
  expires: number;
  capability: string;
  clientId: string;
};

export interface PresenceItem {
  name: string;
  image: string;
  client_id: string;
  isAdmin: boolean;
  isVIP: boolean;
}

export const EventTypes = {
  ROOM_LIST_UPDATE: "room.list.update",
  ROOM_UPDATE: "room.update",
  VOTE_UPDATE: "vote.update",
} as const;

export type EventType = BetterEnum<typeof EventTypes>;
