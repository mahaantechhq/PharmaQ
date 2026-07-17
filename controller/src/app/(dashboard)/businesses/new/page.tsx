import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { CreateBusinessForm } from "@/components/businesses/CreateBusinessForm";

export default function NewBusinessPage() {
  return (
    <div>
      <PageHeader
        title="Create business"
        description="Onboard a new business. This creates their login for both the Business Dashboard and Marketplace."
      />
      <Card>
        <CardBody>
          <CreateBusinessForm />
        </CardBody>
      </Card>
    </div>
  );
}
