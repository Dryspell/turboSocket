import dynamic from "next/dynamic";

const Chat = dynamic(() => import("./components/Chat"), { ssr: false });

export default function ChatPage() {
  return <Chat channelName="chat-demo" clientId="web" />;
}
