import React from "react";
import { TaxAssistantChat } from "./assistant/TaxAssistantChat";

export const AssistantPage: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto py-2 lg:py-4">
      <TaxAssistantChat
        variant="dashboard"
        autoFocusInput
        className="min-h-[min(520px,70vh)]"
      />
    </div>
  );
};
