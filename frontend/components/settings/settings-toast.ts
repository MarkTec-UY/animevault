"use client"

import { toast } from "sonner"

export const settingsToast = {
  saved() {
    toast.success("Profile updated", {
      description: "Your settings have been saved.",
      style: {
        background: "var(--primary)",
        color: "var(--foreground)",
      },
    })
  },

  invalidFields(message?: string) {
    toast.error("Could not save changes", {
      description: message ?? "Review the highlighted fields and try again.",
    })
  },

  saveError(message?: string) {
    toast.error("Could not save changes", {
      description:
        message ?? "Something went wrong while saving your settings.",
    })
  },

  invalidImage(message: string) {
    toast.error("Invalid image", {
      description: message,
    })
  },
}
