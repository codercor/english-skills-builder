import type { RecognitionEvidence } from "@/lib/types";

type StoredHybridResponse = {
  kind: "hybrid_choice_text";
  text: string;
  recognition: RecognitionEvidence;
};

function isStoredHybridResponse(value: unknown): value is StoredHybridResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredHybridResponse>;
  return (
    candidate.kind === "hybrid_choice_text" &&
    typeof candidate.text === "string" &&
    !!candidate.recognition &&
    typeof candidate.recognition === "object"
  );
}

export function encodeStoredPracticeResponse(params: {
  responseText: string;
  recognitionEvidence?: RecognitionEvidence | null;
}) {
  if (!params.recognitionEvidence) {
    return params.responseText;
  }

  return JSON.stringify({
    kind: "hybrid_choice_text",
    text: params.responseText,
    recognition: params.recognitionEvidence,
  } satisfies StoredHybridResponse);
}

export function decodeStoredPracticeResponse(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isStoredHybridResponse(parsed)) {
      return {
        text: parsed.text,
        recognitionEvidence: parsed.recognition,
      };
    }
  } catch {
    // Keep legacy plain-text responses working.
  }

  return {
    text: raw,
    recognitionEvidence: null,
  };
}
