import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

export function useToken({
  room = "intervue",
  name = nanoid(),
}: {
  room?: string;
  name?: string;
}) {
  const [token, setToken] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/get-participant-token?room=${room}&username=${name}`,
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [room, name]);

  return token;
}
