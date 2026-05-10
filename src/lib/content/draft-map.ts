import type { DraftKind, DraftStatus } from "@prisma/client";

export type ClientDraftKind = "idea" | "journal" | "quick-take";
export type ClientDraftStatus = "draft" | "review" | "scheduled" | "published";

export function prismaDraftKindToClient(kind: DraftKind): ClientDraftKind {
  if (kind === "IDEA") return "idea";
  if (kind === "JOURNAL") return "journal";
  return "quick-take";
}

export function clientDraftKindToPrisma(kind: ClientDraftKind): DraftKind {
  if (kind === "idea") return "IDEA";
  if (kind === "journal") return "JOURNAL";
  return "QUICK_TAKE";
}

export function prismaDraftStatusToClient(status: DraftStatus): ClientDraftStatus {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "REVIEW":
      return "review";
    case "SCHEDULED":
      return "scheduled";
    case "PUBLISHED":
      return "published";
    default:
      return "draft";
  }
}

export function clientDraftStatusToPrisma(status: ClientDraftStatus): DraftStatus {
  switch (status) {
    case "draft":
      return "DRAFT";
    case "review":
      return "REVIEW";
    case "scheduled":
      return "SCHEDULED";
    case "published":
      return "PUBLISHED";
    default:
      return "DRAFT";
  }
}
