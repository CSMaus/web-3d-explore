import "@/styles.css";
import i18n from "@/i18n";
import { loadLanguage } from "@/lib/lang";

// the reader's dictionary first: the page modules read it while they load. if it cannot be
// fetched the pages still come up, in english
void loadLanguage(i18n.language)
  .catch(() => undefined)
  .then(() => import("@/boot"));
