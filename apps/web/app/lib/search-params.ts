import { parseAsString, createSearchParamsCache } from "nuqs/server";

export const chatSearchParams = {
  channel: parseAsString.withDefault(""),
  dm: parseAsString.withDefault(""),
  thread: parseAsString.withDefault(""),
};

export const chatSearchParamsCache = createSearchParamsCache(chatSearchParams);
