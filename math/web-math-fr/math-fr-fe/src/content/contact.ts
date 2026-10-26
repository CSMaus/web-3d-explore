import { L } from "@/lib/lang";

/**
 * the contact page. one entry a way to get in touch: a label, the words shown, and where they
 * lead. the address itself is not shown, only the words, as a link.
 */
export type Channel = { label: string; value: string; href?: string };

export const CHANNELS: Channel[] = [{ label: L("Profile"), value: "LinkedIn", href: "https://www.linkedin.com/in/kseniia-b-0a8764194" }];
