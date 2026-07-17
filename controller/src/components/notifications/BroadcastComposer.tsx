"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { broadcastNotification } from "@/app/(dashboard)/notifications/actions";

export function BroadcastComposer({ businesses }: { businesses: { id: string; name: string }[] }) {
  const [target, setTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSend = async () => {
    setLoading(true);
    try {
      await broadcastNotification(target === "all" ? "all" : target, title, message);
      toast("Notification sent", "success");
      setTitle("");
      setMessage("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to send notification", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Recipient" htmlFor="target">
        <Select id="target" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="all">All businesses</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Title" htmlFor="title">
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Platform maintenance" />
      </Field>
      <Field label="Message" htmlFor="message">
        <Textarea id="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement..." />
      </Field>
      <div className="flex justify-end">
        <Button onClick={handleSend} loading={loading} disabled={!title.trim() || !message.trim()}>
          <Send className="h-4 w-4" /> Send
        </Button>
      </div>
    </div>
  );
}
