"use client";
import { AblyProvider } from "ably/react";
import { Realtime } from "ably";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const ablyClient = new Realtime.Promise({
  authUrl: `http://localhost:3004/api/ably?user=${"jamesdoe"}`,
});

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useSearchParams();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AblyProvider client={ablyClient}>
        <section>{children}</section>
      </AblyProvider>
    </Suspense>
  );
}
