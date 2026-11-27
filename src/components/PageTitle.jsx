import { useEffect } from "react";

export default function PageTitle({ title }) {
  useEffect(() => {
    document.title = title ? title + " | Paste Vault" : "Paste Vault — Private code workspace";
  }, [title]);
  return null;
}
