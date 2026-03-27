import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);

export const formatChatTime = (date: string, alwaysShowTime = false) => {
  const msg = dayjs(date);
  const now = dayjs();
  const time = msg.format("HH:mm");

  if (msg.isSame(now, "day")) return time;
  if (msg.isSame(now.subtract(1, "day"), "day")) return `Yesterday ${time}`;
  if (msg.isSameOrAfter(now.startOf("isoWeek"), "day"))
    return alwaysShowTime ? msg.format("dddd HH:mm") : msg.format("dddd");
  return alwaysShowTime ? msg.format("MMM D HH:mm") : msg.format("MMM D");
};
