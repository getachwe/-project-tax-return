-- ═══════════════════════════════════════════════════════════════════
-- Supabase → SQL Editor → New query → הדבק → Run
-- אחרי יצירה: Project Settings → API → "Reload schema" (או המתן דקה)
-- היסטוריית צ'אט — גישה מהשרת בלבד (service role)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chat_conversations_owner_chk CHECK (
    (user_id IS NOT NULL AND guest_session_id IS NULL) OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_idx
  ON chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS chat_conversations_user_updated_idx
  ON chat_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS chat_conversations_guest_session_idx
  ON chat_conversations(guest_session_id);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
