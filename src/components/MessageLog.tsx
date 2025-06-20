import * as React from 'react';
import { Typography, Paper, Box, Divider } from '@mui/material';
import { Config } from '../util/config';

export type MessageEntry = {
  original: string;
  translated: string;
  timestamp: Date;
};

type MessageLogProps = {
  messages: MessageEntry[];
  config: Config;
};

export default function MessageLog({ messages, config }: MessageLogProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Paper
      ref={containerRef}
      elevation={0}
      sx={{
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        padding: 1,
      }}
      className={`${!config.light_mode ? "bg-slate-950 text-white" : "bg-white text-black"}`}
    >
      {messages.length === 0 ? (
        <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body2" color={!config.light_mode ? "rgba(255, 255, 255, 0.6)" : "text.secondary"} className="italic">
            No translation history yet
          </Typography>
        </Box>
      ) : (
        messages.map((message, index) => (
          <Box key={index} mb={1} className="message-entry">
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography 
                variant="caption" 
                color={!config.light_mode ? "rgba(255, 255, 255, 0.6)" : "text.secondary"} 
                className="timestamp"
              >
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              className="original-text" 
              sx={{ 
                fontWeight: 'medium',
                color: !config.light_mode ? "rgba(255, 255, 255, 0.9)" : "inherit"
              }}
            >
              {message.original}
            </Typography>
            <Typography 
              variant="body2" 
              className="translated-text" 
              sx={{ 
                fontStyle: 'italic',
                color: !config.light_mode ? "rgba(255, 255, 255, 0.7)" : "#666" 
              }}
            >
              {message.translated}
            </Typography>
            {index < messages.length - 1 && <Divider sx={{ my: 1, borderColor: !config.light_mode ? "rgba(255, 255, 255, 0.1)" : undefined }} />}
          </Box>
        ))
      )}
    </Paper>
  );
} 