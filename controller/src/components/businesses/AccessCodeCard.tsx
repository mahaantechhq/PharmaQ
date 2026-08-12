"use client";

import { Copy } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function AccessCodeCard({ code }: { code: string }) {
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(code);
    toast("Access code copied", "success");
  };

  return (
    <Card className="mt-6">
      <CardHeader title="Access code" />
      <CardBody>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="font-mono text-lg font-semibold tracking-widest text-slate-800">{code}</span>
          <Button variant="outline" onClick={copy}>
            <Copy className="h-4 w-4" /> Copy
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
