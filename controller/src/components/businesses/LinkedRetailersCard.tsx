"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, X, Building2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { lookupBusinessByAccessCode, linkRetailerByCode, unlinkRetailer } from "@/app/(dashboard)/businesses/actions";

export interface LinkedRetailer {
  linkId: string;
  businessId: string;
  name: string;
  accessCode: string;
}

interface CheckedBusiness {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  status: string;
}

export function LinkedRetailersCard({ wholesalerBusinessId, retailers }: { wholesalerBusinessId: string; retailers: LinkedRetailer[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [linking, setLinking] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [found, setFound] = useState<CheckedBusiness | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedRetailer | null>(null);

  const handleCheck = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const business = await lookupBusinessByAccessCode(code);
      setFound(business);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to look up code", "error");
    } finally {
      setChecking(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!found) return;
    setLinking(true);
    try {
      const result = await linkRetailerByCode(wholesalerBusinessId, code);
      toast(`Linked ${result.retailerName}`, "success");
      setCode("");
      setFound(null);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to link retailer", "error");
    } finally {
      setLinking(false);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!unlinkTarget) return;
    setRemovingId(unlinkTarget.linkId);
    try {
      await unlinkRetailer(unlinkTarget.linkId, wholesalerBusinessId);
      toast("Retailer unlinked", "success");
      setUnlinkTarget(null);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to unlink retailer", "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader title="Linked retailers" description="Retailers linked here are the only ones who see this business's products in the marketplace." />
      <CardBody>
        <div className="flex gap-2">
          <Input
            placeholder="Retailer access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono uppercase"
            maxLength={10}
          />
          <Button variant="outline" onClick={handleCheck} loading={checking} disabled={!code.trim()}>
            Check
          </Button>
        </div>

        {retailers.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 py-8 text-slate-400">
            <Users className="h-6 w-6" />
            <p className="text-sm">No retailers linked yet</p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-slate-100">
            {retailers.map((r) => (
              <li key={r.linkId} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <Link href={`/businesses/${r.businessId}`} className="text-sm font-medium text-slate-800 hover:text-primary-600">
                    {r.name}
                  </Link>
                  <p className="font-mono text-xs text-slate-400">{r.accessCode}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-danger-600 hover:bg-danger-50"
                  loading={removingId === r.linkId}
                  onClick={() => setUnlinkTarget(r)}
                  aria-label={`Unlink ${r.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Modal
        open={!!found}
        onClose={() => setFound(null)}
        title="Link this business?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setFound(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLink} loading={linking}>
              Confirm link
            </Button>
          </>
        }
      >
        {found && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{found.name}</p>
              <p className="text-xs text-slate-500">
                {[found.city, found.state].filter(Boolean).join(", ") || "Location not specified"} · {found.status}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        title="Unlink this retailer?"
        description={unlinkTarget ? `${unlinkTarget.name} will no longer see this business's products in the marketplace.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setUnlinkTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmUnlink} loading={!!removingId}>
              Unlink
            </Button>
          </>
        }
      >
        {unlinkTarget && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger-50 text-danger-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{unlinkTarget.name}</p>
              <p className="font-mono text-xs text-slate-400">{unlinkTarget.accessCode}</p>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
