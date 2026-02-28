import { useEffect } from "react";

const PageTitle = ({ title }) => {
  useEffect(() => {
    document.title = `${title} – PasteApp`;
  }, [title]);

  return null;
};

export default PageTitle;