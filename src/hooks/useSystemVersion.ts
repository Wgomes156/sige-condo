import { useState } from "react";
import { SYSTEM_VERSION_DATE } from "@/lib/versionData";

export function useSystemVersion() {
  const [versionDate] = useState<string>(SYSTEM_VERSION_DATE);

  return { versionDate };
}
