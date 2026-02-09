export const formatMessageTime = (date: string) => {
  return new Date(date).toLocaleTimeString("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
