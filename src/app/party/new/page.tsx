import { PartyForm } from "@/components/party/party-form";

export default function NewPartyPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Party</h1>
      <PartyForm />
    </div>
  );
}
