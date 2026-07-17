import { PageHeader } from "@/components/layout/PageHeader";
import { BulkUploadClient } from "./BulkUploadClient";

export default function BulkUploadPage() {
  return (
    <div>
      <PageHeader title="Bulk upload products" description="Import multiple products and batches at once via CSV." />
      <BulkUploadClient />
    </div>
  );
}
