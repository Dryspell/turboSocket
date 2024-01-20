import { Box, TextField } from "@mui/material";
import { useState } from "react";
import { sendMessage } from "../utils/utils";
import { Types } from "ably";

export default function NewChatInput(props: {
  channel: Types.RealtimeChannelPromise;
  author: string;
}) {
  const [chatText, setChatText] = useState("");

  const handleChatSubmit = () => {
    if (chatText) {
      sendMessage(props.channel, { author: props.author, content: chatText });
      setChatText("");
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <form className="flex-grow" onSubmit={handleChatSubmit}>
        <TextField
          label={`Chat...`}
          fullWidth
          multiline
          maxRows={4}
          placeholder={`Chat...`}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleChatSubmit();
            }
          }}
          value={chatText}
        />
      </form>
    </Box>
  );
}
