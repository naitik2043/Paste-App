import { useEffect } from "react";

export default function PageTitle({ title, description, noindex = true }) {
  useEffect(() => {
    document.title = title ? title + " | Paste Vault" : "Paste Vault — Developer workspace";

    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", noindex ? "noindex,nofollow,noarchive" : "index,follow");

    if (description) {
      const descriptionTag = document.querySelector('meta[name="description"]');
      if (descriptionTag) descriptionTag.setAttribute("content", description);
      const socialDescription = document.querySelector('meta[property="og:description"]');
      if (socialDescription) socialDescription.setAttribute("content", description);
    }

    const socialTitle = document.querySelector('meta[property="og:title"]');
    if (socialTitle && title) socialTitle.setAttribute("content", title + " | Paste Vault");
  }, [title, description, noindex]);

  return null;
}
